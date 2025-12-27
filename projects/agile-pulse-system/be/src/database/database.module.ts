import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import { UserEntity } from '../auth/entities/user.entity';
import { StoryEntity } from '../stories/entities/story.entity';
import { SprintEntity } from '../sprints/entities/sprint.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { CommentEntity } from '../comments/entities/comment.entity';
import { ProjectMemberEntity } from '../projects/entities/project-member.entity';
import { TaskEntity } from '../tasks/entities/task.entity';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config_service: ConfigService) => {
        const use_ssl =
          config_service.get<string>('DATABASE_SSL', 'false') === 'true';

        return {
          type: 'postgres',
          host: config_service.get<string>('DATABASE_HOST', 'localhost'),
          port: parseInt(
            config_service.get<string>('DATABASE_PORT', '5432'),
            10,
          ),
          username: config_service.get<string>('DATABASE_USER', 'agile_user'),
          password: config_service.get<string>(
            'DATABASE_PASSWORD',
            'agile_password',
          ),
          database: config_service.get<string>('DATABASE_NAME', 'agile_pulse'),
          synchronize: true,
          autoLoadEntities: true,
          ssl: use_ssl ? { rejectUnauthorized: false } : false,
          entities: [
            UserEntity,
            StoryEntity,
            SprintEntity,
            ProjectEntity,
            ProjectMemberEntity,
            CommentEntity,
            TaskEntity,
          ],
        };
      },
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
