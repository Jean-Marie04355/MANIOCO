import { Body, Controller, Delete, Get, Patch, Param, Post, UseGuards } from '@nestjs/common';
import { FilesService } from './files.service';
import { CreateFileDto, UpdateFileDto } from './dto/file.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

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
  update(@Param('id') id: string, @Body() updateFileData: Partial<UpdateFileDto>) {
    return this.filesService.update(id, updateFileData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }
}
