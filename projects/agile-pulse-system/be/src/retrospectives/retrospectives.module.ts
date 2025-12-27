import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetrospectivesService } from './retrospectives.service';
import { RetrospectivesController } from './retrospectives.controller';
import { RetroBoardEntity } from './entities/retro-board.entity';
import { RetroCategoryEntity } from './entities/retro-category.entity';
import { RetroItemEntity } from './entities/retro-item.entity';
import { ActionItemEntity } from './entities/action-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RetroBoardEntity,
      RetroCategoryEntity,
      RetroItemEntity,
      ActionItemEntity,
    ]),
  ],
  controllers: [RetrospectivesController],
  providers: [RetrospectivesService],
  exports: [RetrospectivesService],
})
export class RetrospectivesModule {}

