import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class UpdateRetroCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

