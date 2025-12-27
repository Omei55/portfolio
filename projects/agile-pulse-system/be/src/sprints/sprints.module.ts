import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SprintsService } from './sprints.service';
import { SprintsController } from './sprints.controller';
import { SprintEntity } from './entities/sprint.entity';
import { StoryEntity } from '../stories/entities/story.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SprintEntity, StoryEntity])],
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}



