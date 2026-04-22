import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { CreateFileDto, UpdateFileDto } from './dto/file.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
} from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file to S3 and save metadata' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // 1. Upload to S3
    const path = await this.filesService.upload(file);

    // 2. Save metadata in DB
    return this.filesService.create({
      filename: file.originalname,
      path: path,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  @Post()
  create(@Body() createFileData: CreateFileDto) {
    return this.filesService.create(createFileData);
  }

  @Get()
  findAll() {
    return this.filesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFileData: Partial<UpdateFileDto>,
  ) {
    return this.filesService.update(id, updateFileData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }
}
