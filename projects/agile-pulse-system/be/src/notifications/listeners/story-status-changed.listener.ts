import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StoryStatusChangedEvent } from '../events/story-status-changed.event';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class StoryStatusChangedListener {
  private readonly logger = new Logger(StoryStatusChangedListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('story.status.changed')
  async handleStoryStatusChanged(event: StoryStatusChangedEvent) {
    this.logger.log(
      `Received story status changed event for story ${event.story.id}`,
    );

    try {
      await this.notificationService.handleStoryStatusChanged(event);
    } catch (error) {
      this.logger.error(
        `Error handling story status changed event:`,
        error.stack,
      );
    }
  }
}

