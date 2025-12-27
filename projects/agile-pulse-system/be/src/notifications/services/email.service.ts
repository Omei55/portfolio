import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailNotificationDto } from '../dto/email-notification.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!user || !pass) {
      this.logger.warn(
        'SMTP credentials not configured. Email notifications will be logged only.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    this.logger.log('Email transporter initialized');
  }

  async sendEmail(emailDto: EmailNotificationDto): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.log(
          `[Email would be sent] To: ${emailDto.to}, Subject: ${emailDto.subject}`,
        );
        this.logger.debug(`Email content: ${emailDto.html}`);
        return false;
      }

      const from = this.configService.get<string>(
        'SMTP_FROM',
        this.configService.get<string>('SMTP_USER'),
      );

      const mailOptions = {
        from: `"Agile Pulse" <${from}>`,
        to: emailDto.to,
        subject: emailDto.subject,
        html: emailDto.html,
        text: emailDto.text || this.stripHtml(emailDto.html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${emailDto.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${emailDto.to}:`, error);
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n');
  }
}

