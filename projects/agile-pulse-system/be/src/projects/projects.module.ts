import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { DatabaseModule } from '../database/database.module';
import { UserEntity } from '../auth/entities/user.entity';
import { ProjectEntity } from './entities/project.entity';
import { ProjectMemberEntity } from './entities/project-member.entity';
import { ProjectMemberGuard } from './guards/project-member.guard';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([UserEntity, ProjectEntity, ProjectMemberEntity]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectMemberGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}

