import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from './mailer.module';
import { MailerService } from './mailer.service';

describe('MailerModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [
                        () => ({
                            SMTP_HOST: 'smtp.example.com',
                            SMTP_PORT: '587',
                            SMTP_SECURE: 'false',
                            SMTP_USER: 'test@example.com',
                            SMTP_PASS: 'password',
                            SMTP_FROM: 'Afrigari <noreply@afrigari.com>',
                        }),
                    ],
                }),
                MailerModule,
            ],
        }).compile();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should provide MailerService', () => {
        const mailerService = module.get<MailerService>(MailerService);
        expect(mailerService).toBeDefined();
    });
});
