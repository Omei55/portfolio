import { IsArray, IsEnum, IsOptional } from 'class-validator';

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
}

export enum ExportTarget {
  JIRA = 'jira',
  TAIGA = 'taiga',
  GENERIC = 'generic',
}

export class ExportStoriesDto {
  @IsArray()
  @IsOptional()
  storyIds?: string[];

  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsEnum(ExportTarget)
  target: ExportTarget;
}



