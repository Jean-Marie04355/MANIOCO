import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ReportStatus } from '../report.entity';

export class UpdateReportDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  internalNote?: string;
}
