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
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST || '127.0.0.1';
    const port = Number(process.env.SMTP_PORT || 1025);
    // Force IPv4 if localhost is provided
    const finalHost = host === 'localhost' ? '127.0.0.1' : host;

    this.logger.log(
      `Initializing Mailer with host: ${finalHost}, port: ${port}`,
    );

    this.transporter = nodemailer.createTransport({
      host: finalHost,
      port: port,
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_USER !== 'null'
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      tls: {
        // En prod, on DOIT vérifier les certificats. En dev/test, on peut outrepasser via env.
        rejectUnauthorized:
          process.env.NODE_ENV === 'production'
            ? process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
            : false,
      },
    });
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

      this.logger.log('Email sent successfully');
    } catch (error: any) {
      this.logger.error(
        `Failed to send email to ${options.to}. Error: ${error.message}`,
      );
      this.logger.warn(`Fallback (DEV ONLY) - Contenu de l'email :
      ---------------------------------
      Sujet: ${options.subject}
      Message: ${options.text || options.html}
      ---------------------------------`);
      // In dev, we don't always want to crash the worker if SMTP fails
      if (process.env.NODE_ENV === 'development') return;
      throw error;
    }
  }
}

export const emailService = new EmailService();
