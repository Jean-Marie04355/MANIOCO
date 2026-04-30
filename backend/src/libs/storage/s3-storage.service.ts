import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { IStorageService } from './interfaces/storage-service.interface';

@Injectable()
export class S3StorageService implements IStorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('S3_ENDPOINT');

    this.bucketName = this.configService.get<string>(
      'S3_BUCKET_NAME',
      'afrigari-bucket',
    );

    const accessKeyId =
      this.configService.getOrThrow<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.getOrThrow<string>(
      'S3_SECRET_ACCESS_KEY',
    );

    this.s3Client = new S3Client({
      region: this.configService.get<string>('S3_REGION', 'garage'),
      endpoint: this.endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });

    // Create bucket if it doesn't exist
    this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      const { CreateBucketCommand, HeadBucketCommand } =
        await import('@aws-sdk/client-s3');
      try {
        await this.s3Client.send(
          new HeadBucketCommand({ Bucket: this.bucketName }),
        );
      } catch (error) {
        this.logger.log(`Bucket ${this.bucketName} not found, creating it...`);
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        this.logger.log(`Bucket ${this.bucketName} created successfully.`);
      }

      // Always ensure public read policy is applied
      try {
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        const { PutBucketPolicyCommand } = await import('@aws-sdk/client-s3');
        await this.s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: this.bucketName,
            Policy: JSON.stringify(policy),
          }),
        );
        this.logger.log(
          `Public access policy ensured for bucket ${this.bucketName}.`,
        );
      } catch (error) {
        this.logger.error(
          `Could not set bucket policy: ${(error as Error).message}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Could not ensure bucket existence: ${(error as Error).message}`,
      );
    }
  }

  async uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    objectName?: string,
  ): Promise<string> {
    const name = objectName || `${Date.now()}-${file.originalname}`;

    try {
      // Check if object already exists
      try {
        await this.s3Client.send(
          new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: name,
          }),
        );
        // If it exists, return signed URL
        return await this.presignedGetObject(name);
      } catch (err) {
        const error = err as {
          name?: string;
          $metadata?: { httpStatusCode?: number };
        };
        if (
          error.name !== 'NotFound' &&
          error.$metadata?.httpStatusCode !== 404
        ) {
          throw err;
        }
      }

      // Upload
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: name,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      // Return signed URL (valid for 7 days)
      return await this.presignedGetObject(name);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error uploading to S3: ${err.message}`);
      throw new HttpException(
        `Error uploading file: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteFile(objectName: string): Promise<void> {
    try {
      const key = this.extractKey(objectName);
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error deleting from S3: ${err.message}`);
      throw new HttpException(
        `Error deleting file: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteMultipleFiles(objectNames: string[]): Promise<void> {
    try {
      const objects = objectNames.map((name) => ({
        Key: this.extractKey(name),
      }));
      await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: { Objects: objects },
        }),
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error deleting multiple files from S3: ${err.message}`,
      );
      throw new HttpException(
        `Error deleting files: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateFile(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    objectName: string,
  ): Promise<string> {
    await this.deleteFile(objectName);
    return await this.uploadFile(file, objectName);
  }

  async presignedGetObject(objectName: string): Promise<string> {
    try {
      const key = this.extractKey(objectName);
      return await Promise.resolve(
        `${this.endpoint}/${this.bucketName}/${key}`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error generating URL: ${err.message}`);
      return await Promise.resolve(objectName);
    }
  }

  async listAllObjects(): Promise<string[]> {
    try {
      const response = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
        }),
      );
      return response.Contents?.map((obj) => obj.Key || '') || [];
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error listing objects: ${err.message}`);
      throw new HttpException(
        `Error listing objects: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private extractKey(path: string): string {
    if (path.includes(`${this.endpoint}/${this.bucketName}/`)) {
      return path.split(`${this.endpoint}/${this.bucketName}/`)[1];
    }
    if (path.includes('?')) {
      const urlPart = path.split('?')[0];
      return urlPart.split('/').pop() || path;
    }
    return path.split('/').pop() || path;
  }
}
