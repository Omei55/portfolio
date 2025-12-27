import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StoriesModule } from './stories/stories.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { SprintsModule } from './sprints/sprints.module';
import { ProjectsModule } from './projects/projects.module';
import { CommentsModule } from './comments/comments.module';
import { TasksModule } from './tasks/tasks.module';
import { ExportModule } from './export/export.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RetrospectivesModule } from './retrospectives/retrospectives.module';
import { AnalyticsModule } from './analytics/analytics.module';


@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    StoriesModule,
    AuthModule,
    SprintsModule,
    ProjectsModule,
    CommentsModule,
    TasksModule,
    AnalyticsModule,
    RetrospectivesModule,
    ExportModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
