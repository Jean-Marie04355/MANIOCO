import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  DeleteObjectsCommand, 
  ListObjectsV2Command, 
  GetObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageService } from './interfaces/storage-service.interface';

@Injectable()
export class S3StorageService implements IStorageService {
    private readonly logger = new Logger(S3StorageService.name);
    private readonly s3Client: S3Client;
    private readonly bucketName: string;
    private readonly endpoint: string;

    constructor(private readonly configService: ConfigService) {
        this.endpoint = this.configService.get<string>('S3_ENDPOINT', 'http://127.0.0.1:3900');
        this.bucketName = this.configService.get<string>('S3_BUCKET_NAME', 'afrigari-bucket');

        const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY');

        this.s3Client = new S3Client({
            region: this.configService.get<string>('S3_REGION', 'garage'),
            endpoint: this.endpoint,
            credentials: {
                accessKeyId: accessKeyId || '',
                secretAccessKey: secretAccessKey || '',
            },
            forcePathStyle: true,
        });
    }

    async uploadFile(file: Express.Multer.File, objectName?: string): Promise<string> {
        const name = objectName || `${Date.now()}-${file.originalname}`;
        
        try {
            // Check if object already exists
            try {
                await this.s3Client.send(new HeadObjectCommand({
                    Bucket: this.bucketName,
                    Key: name
                }));
                // If it exists, return signed URL
                return await this.presignedGetObject(name);
            } catch (err) {
                if (err.name !== 'NotFound' && err.$metadata?.httpStatusCode !== 404) {
                    throw err;
                }
            }

            // Upload
            await this.s3Client.send(new PutObjectCommand({
                Bucket: this.bucketName,
                Key: name,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));

            // Return signed URL (valid for 7 days)
            return await this.presignedGetObject(name);
        } catch (error) {
            this.logger.error(`Error uploading to S3: ${error.message}`);
            throw new HttpException(`Error uploading file: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteFile(objectName: string): Promise<void> {
        try {
            const key = this.extractKey(objectName);
            await this.s3Client.send(new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            }));
        } catch (error) {
            this.logger.error(`Error deleting from S3: ${error.message}`);
            throw new HttpException(`Error deleting file: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteMultipleFiles(objectNames: string[]): Promise<void> {
        try {
            const objects = objectNames.map(name => ({ Key: this.extractKey(name) }));
            await this.s3Client.send(new DeleteObjectsCommand({
                Bucket: this.bucketName,
                Delete: { Objects: objects }
            }));
        } catch (error) {
            this.logger.error(`Error deleting multiple files from S3: ${error.message}`);
            throw new HttpException(`Error deleting files: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateFile(file: Express.Multer.File, objectName: string): Promise<string> {
        await this.deleteFile(objectName);
        return await this.uploadFile(file, objectName);
    }

    async presignedGetObject(objectName: string): Promise<string> {
        try {
            const key = this.extractKey(objectName);
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            // URL valid for 7 days (604800 seconds)
            return await getSignedUrl(this.s3Client, command, { expiresIn: 604800 });
        } catch (error) {
            this.logger.error(`Error generating presigned URL: ${error.message}`);
            return objectName; // Fallback to raw path if signing fails
        }
    }

    async listAllObjects(): Promise<string[]> {
        try {
            const response = await this.s3Client.send(new ListObjectsV2Command({
                Bucket: this.bucketName,
            }));
            return response.Contents?.map(obj => obj.Key || '') || [];
        } catch (error) {
            this.logger.error(`Error listing objects: ${error.message}`);
            throw new HttpException(`Error listing objects: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private extractKey(path: string): string {
        // If it's a URL, extract the part after the bucket name
        if (path.includes(`${this.endpoint}/${this.bucketName}/`)) {
            return path.split(`${this.endpoint}/${this.bucketName}/`)[1];
        }
        // If it's a signed URL with query params
        if (path.includes('?')) {
            const urlPart = path.split('?')[0];
            return urlPart.split('/').pop() || path;
        }
        return path.split('/').pop() || path;
    }
}
