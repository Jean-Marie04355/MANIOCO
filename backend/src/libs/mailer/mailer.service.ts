import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailerService {
    constructor(private readonly mailerService: NestMailerService) {}

    async sendMail(to: string, subject: string, html: string, text?: string) {
        return await this.mailerService.sendMail({
            to,
            subject,
            html,
            text,
        });
    }

    async sendTemplatedMail(to: string, subject: string, template: string, context: any) {
        return await this.mailerService.sendMail({
            to,
            subject,
            template,
            context,
        });
    }
}
