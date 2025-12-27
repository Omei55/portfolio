import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { StoryStatusChangedEvent } from '../events/story-status-changed.event';
import { EmailNotificationDto } from '../dto/email-notification.dto';
import { DatabaseService } from '../../database/database.service';
import { UserEntity } from '../../auth/entities/user.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly databaseService: DatabaseService,
  ) {}

  async handleStoryStatusChanged(event: StoryStatusChangedEvent): Promise<void> {
    this.logger.log(
      `Story status changed: ${event.story.id} from ${event.previousStatus} to ${event.newStatus}`,
    );

    // Only send email if there's an assignee
    if (!event.story.assignee) {
      this.logger.debug(
        `No assignee for story ${event.story.id}, skipping email notification`,
      );
      return;
    }

    // Try to find user by email first (if assignee is an email)
    let assigneeEmail: string | null = null;
    
    if (event.story.assignee.includes('@')) {
      // Assignee is already an email
      assigneeEmail = event.story.assignee;
    } else {
      // Try to find user by ID, then email, then name
      try {
        let user = await this.databaseService.find_one(UserEntity, {
          where: { id: event.story.assignee },
        });

        if (!user) {
          user = await this.databaseService.find_one(UserEntity, {
            where: { email: event.story.assignee },
          });
        }

        if (!user) {
          user = await this.databaseService.find_one(UserEntity, {
            where: { full_name: event.story.assignee },
          });
        }

        if (user) {
          assigneeEmail = user.email;
        } else {
          this.logger.warn(
            `Could not find user for assignee: ${event.story.assignee}`,
          );
          return;
        }
      } catch (error) {
        this.logger.error(
          `Error looking up user for assignee ${event.story.assignee}:`,
          error,
        );
        return;
      }
    }

    if (!assigneeEmail) {
      this.logger.warn(
        `Could not determine email for assignee: ${event.story.assignee}`,
      );
      return;
    }

    const emailDto: EmailNotificationDto = {
      to: assigneeEmail,
      subject: `Story Status Updated: ${event.story.title}`,
      html: this.generateStatusChangeEmailHtml(event),
      text: this.generateStatusChangeEmailText(event),
    };

    await this.emailService.sendEmail(emailDto);
  }

  private generateStatusChangeEmailHtml(
    event: StoryStatusChangedEvent,
  ): string {
    const statusColors: Record<string, string> = {
      'To Do': '#718096',
      'In Progress': '#4299e1',
      'In Review': '#ed8936',
      Done: '#48bb78',
      Blocked: '#e53e3e',
    };

    const previousColor = statusColors[event.previousStatus] || '#718096';
    const newColor = statusColors[event.newStatus] || '#718096';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e2e8f0;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .story-title {
              font-size: 20px;
              font-weight: 700;
              color: #1a202c;
              margin: 20px 0;
            }
            .status-change {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
              margin: 30px 0;
            }
            .status-badge {
              padding: 8px 16px;
              border-radius: 6px;
              color: white;
              font-weight: 600;
              font-size: 14px;
            }
            .arrow {
              font-size: 24px;
              color: #718096;
            }
            .details {
              background: #f7fafc;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #4a5568;
            }
            .detail-value {
              color: #2d3748;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              color: #718096;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Story Status Updated</h1>
          </div>
          <div class="content">
            <div class="story-title">${this.escapeHtml(event.story.title)}</div>
            
            <div class="status-change">
              <span class="status-badge" style="background-color: ${previousColor}">
                ${this.escapeHtml(event.previousStatus)}
              </span>
              <span class="arrow">→</span>
              <span class="status-badge" style="background-color: ${newColor}">
                ${this.escapeHtml(event.newStatus)}
              </span>
            </div>

            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Story ID:</span>
                <span class="detail-value">${event.story.id}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Priority:</span>
                <span class="detail-value">${this.escapeHtml(event.story.priority || 'Medium')}</span>
              </div>
              ${event.story.storyPoints ? `
              <div class="detail-row">
                <span class="detail-label">Story Points:</span>
                <span class="detail-value">${event.story.storyPoints}</span>
              </div>
              ` : ''}
              ${event.story.sprint ? `
              <div class="detail-row">
                <span class="detail-label">Sprint:</span>
                <span class="detail-value">${this.escapeHtml(event.story.sprint)}</span>
              </div>
              ` : ''}
              ${event.story.epic ? `
              <div class="detail-row">
                <span class="detail-label">Epic:</span>
                <span class="detail-value">${this.escapeHtml(event.story.epic)}</span>
              </div>
              ` : ''}
              ${event.changedBy ? `
              <div class="detail-row">
                <span class="detail-label">Changed By:</span>
                <span class="detail-value">${this.escapeHtml(event.changedBy)}</span>
              </div>
              ` : ''}
            </div>

            ${event.story.description ? `
            <div style="margin-top: 20px;">
              <strong>Description:</strong>
              <p style="color: #4a5568; margin-top: 8px;">${this.escapeHtml(event.story.description)}</p>
            </div>
            ` : ''}

            <div class="footer">
              <p>This is an automated notification from Agile Pulse.</p>
              <p>You received this email because you are assigned to this story.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateStatusChangeEmailText(
    event: StoryStatusChangedEvent,
  ): string {
    return `
Story Status Updated

Story: ${event.story.title}
Status Changed: ${event.previousStatus} → ${event.newStatus}

Story ID: ${event.story.id}
Priority: ${event.story.priority || 'Medium'}
${event.story.storyPoints ? `Story Points: ${event.story.storyPoints}\n` : ''}
${event.story.sprint ? `Sprint: ${event.story.sprint}\n` : ''}
${event.story.epic ? `Epic: ${event.story.epic}\n` : ''}
${event.changedBy ? `Changed By: ${event.changedBy}\n` : ''}

${event.story.description ? `Description:\n${event.story.description}\n` : ''}

---
This is an automated notification from Agile Pulse.
You received this email because you are assigned to this story.
    `.trim();
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

