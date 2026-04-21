import * as nodemailer from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***@***';
    return `${local[0]}***@${domain}`;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const from = process.env.SMTP_FROM || '"Afrigari" <noreply@afrigari.com>';
    
    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      // Use internal process.stdout for worker if Logger is not initialized by Nest
      const maskedTo = this.maskEmail(options.to);
      const msg = `Email sent successfully to ${maskedTo}`;
      if (process.env.NODE_ENV === 'production' || !this.logger) {
        console.log(`[EmailService] ${msg}`);
      } else {
        this.logger.log(msg);
      }
    } catch (error: any) {
      const maskedTo = this.maskEmail(options.to);
      const errMsg = `Failed to send email to ${maskedTo}: ${error.message}`;
      console.error(`[EmailService] ${errMsg}`);
      throw error;
    }
  }
}

export const emailService = new EmailService();
