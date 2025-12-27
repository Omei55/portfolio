import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { StoryEntity } from './entities/story.entity';
import { ReadinessCheckerService } from './readiness-checker.service';

@Module({
  imports: [TypeOrmModule.forFeature([StoryEntity]), EventEmitterModule],
  controllers: [StoriesController],
  providers: [StoriesService, ReadinessCheckerService],
  exports: [StoriesService],
})
export class StoriesModule {}
