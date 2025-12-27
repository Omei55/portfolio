import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRetrospectiveDto {
  @IsOptional()
  @IsString()
  sprintId?: string;

  @IsOptional()
  @IsString()
  sprintName?: string;

  @IsString()
  @IsNotEmpty()
  wentWell: string;

  @IsString()
  @IsNotEmpty()
  toImprove: string;

  @IsString()
  @IsNotEmpty()
  actionItems: string;
}

