import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationPreferenceEntity } from './entities/notification-preference.entity';
import { NotificationResponseDto } from './dto/notification-response.dto';
import {
  NotificationPreferenceDto,
  UpdateNotificationPreferenceDto,
} from './dto/notification-preference.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
    @InjectRepository(NotificationPreferenceEntity)
    private readonly preferencesRepository: Repository<NotificationPreferenceEntity>,
  ) {}

  private toResponseDto(
    notification: NotificationEntity,
  ): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      readAt: notification.read_at,
      metadata: notification.metadata,
      createdAt: notification.created_at,
      updatedAt: notification.updated_at,
    };
  }

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata?: any,
  ): Promise<NotificationResponseDto> {
    // Check user preferences before creating notification
    const preferences = await this.getUserPreferences(userId);
    if (!preferences) {
      // Create default preferences if they don't exist
      await this.createDefaultPreferences(userId);
    }

    const notification = this.notificationsRepository.create({
      user_id: userId,
      type,
      title,
      message,
      metadata: metadata || null,
      read: false,
    });

    const savedNotification = await this.notificationsRepository.save(
      notification,
    );
    return this.toResponseDto(savedNotification);
  }

  async getUserNotifications(userId: string): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 50, // Limit to last 50 notifications
    });

    return notifications.map((notification) => this.toResponseDto(notification));
  }

  async getUnreadNotifications(
    userId: string,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationsRepository.find({
      where: { user_id: userId, read: false },
      order: { created_at: 'DESC' },
    });

    return notifications.map((notification) => this.toResponseDto(notification));
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    notification.read_at = new Date();
    await this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { user_id: userId, read: false },
      { read: true, read_at: new Date() },
    );
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationsRepository.delete({
      id: notificationId,
      user_id: userId,
    });

    if (!result.affected) {
      throw new NotFoundException('Notification not found');
    }
  }

  async getUserPreferences(
    userId: string,
  ): Promise<NotificationPreferenceDto | null> {
    const preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      return null;
    }

    return {
      storySprintReady: preferences.story_sprint_ready,
      storyExported: preferences.story_exported,
      mvpFinalized: preferences.mvp_finalized,
      storyStatusChanged: preferences.story_status_changed,
      emailNotifications: preferences.email_notifications,
      pushNotifications: preferences.push_notifications,
    };
  }

  async createDefaultPreferences(userId: string): Promise<NotificationPreferenceDto> {
    const preferences = this.preferencesRepository.create({
      user_id: userId,
      story_sprint_ready: true,
      story_exported: true,
      mvp_finalized: true,
      story_status_changed: true,
      email_notifications: false,
      push_notifications: true,
    });

    const saved = await this.preferencesRepository.save(preferences);
    return {
      storySprintReady: saved.story_sprint_ready,
      storyExported: saved.story_exported,
      mvpFinalized: saved.mvp_finalized,
      storyStatusChanged: saved.story_status_changed,
      emailNotifications: saved.email_notifications,
      pushNotifications: saved.push_notifications,
    };
  }

  async updateUserPreferences(
    userId: string,
    updateDto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreferenceDto> {
    let preferences = await this.preferencesRepository.findOne({
      where: { user_id: userId },
    });

    if (!preferences) {
      await this.createDefaultPreferences(userId);
      preferences = await this.preferencesRepository.findOne({
        where: { user_id: userId },
      });
    }

    if (updateDto.storySprintReady !== undefined) {
      preferences.story_sprint_ready = updateDto.storySprintReady;
    }
    if (updateDto.storyExported !== undefined) {
      preferences.story_exported = updateDto.storyExported;
    }
    if (updateDto.mvpFinalized !== undefined) {
      preferences.mvp_finalized = updateDto.mvpFinalized;
    }
    if (updateDto.storyStatusChanged !== undefined) {
      preferences.story_status_changed = updateDto.storyStatusChanged;
    }
    if (updateDto.emailNotifications !== undefined) {
      preferences.email_notifications = updateDto.emailNotifications;
    }
    if (updateDto.pushNotifications !== undefined) {
      preferences.push_notifications = updateDto.pushNotifications;
    }

    const saved = await this.preferencesRepository.save(preferences);
    return {
      storySprintReady: saved.story_sprint_ready,
      storyExported: saved.story_exported,
      mvpFinalized: saved.mvp_finalized,
      storyStatusChanged: saved.story_status_changed,
      emailNotifications: saved.email_notifications,
      pushNotifications: saved.push_notifications,
    };
  }
}

