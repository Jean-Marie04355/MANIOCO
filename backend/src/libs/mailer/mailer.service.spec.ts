import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

describe('MailerService', () => {
    let service: MailerService;
    let nestMailerService: NestMailerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailerService,
                {
                    provide: NestMailerService,
                    useValue: {
                        sendMail: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<MailerService>(MailerService);
        nestMailerService = module.get<NestMailerService>(NestMailerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should send an email', async () => {
        const mailOptions = {
            to: 'recipient@example.com',
            subject: 'Test Subject',
            html: '<p>Test Email</p>',
        };

        await service.sendMail(
            mailOptions.to,
            mailOptions.subject,
            mailOptions.html,
        );

        expect(nestMailerService.sendMail).toHaveBeenCalledWith(
            expect.objectContaining(mailOptions),
        );
    });
});
