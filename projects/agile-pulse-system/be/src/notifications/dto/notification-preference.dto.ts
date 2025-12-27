export class NotificationPreferenceDto {
  storySprintReady: boolean;
  storyExported: boolean;
  mvpFinalized: boolean;
  storyStatusChanged: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export class UpdateNotificationPreferenceDto {
  storySprintReady?: boolean;
  storyExported?: boolean;
  mvpFinalized?: boolean;
  storyStatusChanged?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

