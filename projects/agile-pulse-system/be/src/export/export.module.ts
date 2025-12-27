import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { StoriesModule } from '../stories/stories.module';

@Module({
  imports: [StoriesModule, HttpModule],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}

