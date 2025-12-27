import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateRetroItemDto {
  @IsUUID()
  @IsNotEmpty()
  boardId: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  displayOrder?: number;
}

