# Notifications Module

This module handles email notifications for story status changes in the Agile Pulse application.

## Features

- **Event-Driven Architecture**: Uses NestJS EventEmitter to trigger notifications when story status changes
- **Email Service**: Sends HTML and plain text emails using nodemailer
- **Automatic Notifications**: Automatically sends email confirmations to story assignees when status changes

## Configuration

To enable email notifications, configure the following environment variables in your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Agile Pulse <your-email@gmail.com>
```

### Gmail Setup

If using Gmail, you'll need to:
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password as `SMTP_PASS`

### Other Email Providers

For other email providers, adjust the SMTP settings accordingly:

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## How It Works

1. When a story's status is updated via the `StoriesService.update()` method, the service checks if the status has changed
2. If the status changed, it emits a `StoryStatusChangedEvent` using the EventEmitter
3. The `StoryStatusChangedListener` listens for this event
4. The listener calls `NotificationService.handleStoryStatusChanged()`
5. The notification service generates an HTML email and sends it to the story assignee

## Email Content

The email includes:
- Story title
- Previous and new status (with color-coded badges)
- Story details (ID, priority, story points, sprint, epic)
- Story description
- Information about who changed the status (if available)

## Development Mode

If SMTP credentials are not configured, the service will:
- Log email notifications to the console instead of sending them
- Continue to function normally without errors
- Allow you to test the notification flow without email setup

## Testing

To test the notification system:

1. Ensure SMTP credentials are configured (or use development mode)
2. Update a story's status via the API
3. Check the logs for notification events
4. If configured, check the assignee's email inbox

## Extending

To add notifications for other events:

1. Create a new event class in `events/`
2. Create a listener in `listeners/`
3. Emit the event from the appropriate service
4. Handle the event in `NotificationService`

Example:
```typescript
// events/task-assigned.event.ts
export class TaskAssignedEvent {
  constructor(public readonly task: TaskResponseDto) {}
}

// listeners/task-assigned.listener.ts
@OnEvent('task.assigned')
async handleTaskAssigned(event: TaskAssignedEvent) {
  await this.notificationService.handleTaskAssigned(event);
}
```

