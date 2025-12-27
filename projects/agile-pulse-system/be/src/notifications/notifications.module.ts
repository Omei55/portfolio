import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './services/email.service';
import { NotificationService } from './services/notification.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { StoryStatusChangedListener } from './listeners/story-status-changed.listener';
import { DatabaseModule } from '../database/database.module';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationPreferenceEntity } from './entities/notification-preference.entity';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule,
    DatabaseModule,
    TypeOrmModule.forFeature([NotificationEntity, NotificationPreferenceEntity]),
  ],
  controllers: [NotificationsController],
  providers: [EmailService, NotificationService, NotificationsService, StoryStatusChangedListener],
  exports: [EmailService, NotificationService, NotificationsService],
})
export class NotificationsModule {}

