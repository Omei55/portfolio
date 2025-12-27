import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateNotificationPreferenceDto } from './dto/notification-preference.dto';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  async getUserNotifications(@Request() req: any) {
    const userId = req.user?.user_id || req.user?.sub || req.user?.id;
    return this.notificationsService.getUserNotifications(userId);
  }

  @Get('unread')
  async getUnreadNotifications(@Request() req: any) {
    const userId = req.user?.user_id || req.user?.sub || req.user?.id;
    return this.notificationsService.getUnreadNotifications(userId);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.user_id || req.user?.sub || req.user?.id;
    await this.notificationsService.markAsRead(id, userId);
    return { message: 'Notification marked as read' };
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req: any) {
    const userId = req.user?.user_id || req.user?.sub || req.user?.id;
    await this.notificationsService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.user_id || req.user?.sub || req.user?.id;
    await this.notificationsService.deleteNotification(id, userId);
    return { message: 'Notification deleted' };
  }

  @Get('preferences')
  async getUserPreferences(@Request() req: any) {
    const userId = req.user?.user_id || req.user?.sub || req.user?.id;
    const preferences = await this.notificationsService.getUserPreferences(
      userId,
    );
    if (!preferences) {
      return this.notificationsService.createDefaultPreferences(userId);
    }
    return preferences;
  }

  @Patch('preferences')
  async updateUserPreferences(
    @Request() req: any,
    @Body() updateDto: UpdateNotificationPreferenceDto,
  ) {
    const userId = req.user?.user_id || req.user?.sub || req.user?.id;
    return this.notificationsService.updateUserPreferences(userId, updateDto);
  }
}

