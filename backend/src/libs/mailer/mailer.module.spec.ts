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
                            MAIL_HOST: 'smtp.example.com',
                            MAIL_PORT: '587',
                            MAIL_SECURE: 'false',
                            MAIL_USER: 'test@example.com',
                            MAIL_PASSWORD: 'password',
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
