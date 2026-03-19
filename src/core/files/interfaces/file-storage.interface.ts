import { CreateFileDto, FileResponse, UpdateFileDto } from '../dto/file.dto';

export interface IFileStorage {
    findAll(): Promise<FileResponse[]>;
    findOne(id: string): Promise<FileResponse | null>;
    create(data: CreateFileDto): Promise<FileResponse>;
    update(id: string, data: Partial<UpdateFileDto>): Promise<FileResponse | null>;
    delete(id: string): Promise<boolean>;
}
