import { IsEnum, IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum ExportPlatform {
  JIRA = 'jira',
  TAIGA = 'taiga',
}

export enum JiraAuthType {
  BASIC = 'basic',
  OAUTH = 'oauth',
  API_TOKEN = 'api_token',
}

export enum TaigaAuthType {
  TOKEN = 'token',
}

export class JiraAuthConfig {
  @IsEnum(JiraAuthType)
  type: JiraAuthType;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  apiToken?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  consumerKey?: string;

  @IsOptional()
  @IsString()
  consumerSecret?: string;
}

export class TaigaAuthConfig {
  @IsEnum(TaigaAuthType)
  type: TaigaAuthType;

  @IsString()
  token: string;
}

export class ExportConfig {
  @IsEnum(ExportPlatform)
  platform: ExportPlatform;

  @IsString()
  @IsNotEmpty()
  baseUrl: string;

  @IsString()
  @IsNotEmpty()
  projectKey: string; // Jira project key or Taiga project ID

  @IsOptional()
  @IsString()
  issueType?: string; // For Jira, default: "Story"

  @ValidateNested()
  @Type(() => Object)
  auth: JiraAuthConfig | TaigaAuthConfig;
}

export class ExportStoriesDto {
  @IsArray()
  @IsNotEmpty()
  storyIds: string[];

  @ValidateNested()
  @Type(() => ExportConfig)
  config: ExportConfig;
}


