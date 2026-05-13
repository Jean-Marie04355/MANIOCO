import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';

describe('MailerService', () => {
    let service: MailerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailerService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const config = {
                                MAIL_HOST: 'smtp.example.com',
                                MAIL_PORT: '587',
                                MAIL_SECURE: 'false',
                                MAIL_USER: 'test@example.com',
                                MAIL_PASSWORD: 'password',
                            };
                            return config[key];
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<MailerService>(MailerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should send an email', async () => {
        const sendMailSpy = jest
            .spyOn(service['transporter'], 'sendMail')
            .mockResolvedValue({ messageId: '12345' });

        const result = await service.sendMail(
            'recipient@example.com',
            'Test Subject',
            '<p>Test Email</p>',
        );

        expect(sendMailSpy).toHaveBeenCalled();
        expect(result).toEqual({ messageId: '12345' });
    });
});
