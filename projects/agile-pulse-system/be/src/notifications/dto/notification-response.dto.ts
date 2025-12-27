export class NotificationResponseDto {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt?: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

