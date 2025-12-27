import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportStoriesDto } from './dto/export-stories.dto';
import { ExportResponseDto } from './dto/export-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('stories')
  @HttpCode(HttpStatus.OK)
  async exportStories(@Body() exportDto: ExportStoriesDto): Promise<ExportResponseDto> {
    return this.exportService.exportStories(exportDto);
  }
}


