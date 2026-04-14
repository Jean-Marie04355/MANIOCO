import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFileDto {
  @ApiProperty({ description: 'The original name of the file' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: 'The absolute or relative path to the stored file',
  })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({
    description: 'The MIME type of the file',
    example: 'application/pdf',
  })
  @IsString()
  @IsNotEmpty()
  mimetype: string;

  @ApiProperty({ description: 'The size of the file in bytes' })
  @IsNumber()
  @IsNotEmpty()
  size: number;
}

export class UpdateFileDto extends CreateFileDto {}

export interface FileResponse {
  id: string; // Unified ID (string mapping back to either ObjectId, UUID, or string)
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  createdAt?: Date;
  updatedAt?: Date;
}
