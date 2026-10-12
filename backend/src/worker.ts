import 'dotenv/config';
import { Worker, type ConnectionOptions, type Job } from 'bullmq';
import { emailService } from './libs/email/email.service';
import {
  getOtpTemplate,
  getOrderConfirmationTemplate,
  getResetPasswordTemplate,
} from './libs/email/templates';

export async function handleWorkerJob(job: Job) {
  const log = (msg: string) => process.stdout.write(`${msg}\n`);

  if (job.name === 'send-otp-email') {
    const { email, otpCode } = job.data;
    log(`[worker] Processing send-otp-email for ${email}`);

    try {
      log(`[worker] DEV ONLY - Catch OTP Code: ${otpCode}`);
      await emailService.sendEmail({
        to: email,
        subject: 'Votre code de vérification Afrigari',
        html: getOtpTemplate(otpCode),
      });
      log(`[worker] OTP email sent successfully to ${email}`);
      return { ok: true, emailSent: true };
    } catch (error) {
      log(`[worker] Failed to send OTP email to ${email}: ${error.message}`);
      throw error;
    }
  }

  if (job.name === 'send-reset-password-email') {
    const { email, resetLink } = job.data;
    log(`[worker] Processing send-reset-password-email for ${email}`);
    log(`[worker] DEV ONLY - Catch Reset Password Link: ${resetLink}`);

    try {
      await emailService.sendEmail({
        to: email,
        subject: 'Réinitialisation de votre mot de passe Afrigari',
        html: getResetPasswordTemplate(resetLink),
      });
      log(`[worker] Reset password email sent successfully to ${email}`);
      return { ok: true, emailSent: true };
    } catch (error) {
      log(
        `[worker] Failed to send reset password email to ${email}: ${error.message}`,
      );
      throw error;
    }
  }

  if (job.name === 'send-order-confirmation') {
    const { email, orderId, totalAmount, items } = job.data;
    log(
      `[worker] Processing send-order-confirmation for ${email} (Order #${orderId})`,
    );

    try {
      await emailService.sendEmail({
        to: email,
        subject: `Confirmation de votre commande #${orderId} - Afrigari`,
        html: getOrderConfirmationTemplate(orderId, totalAmount, items),
      });
      log(`[worker] Order confirmation email sent successfully to ${email}`);
      return { ok: true, emailSent: true };
    } catch (error) {
      log(
        `[worker] Failed to send order confirmation to ${email}: ${error.message}`,
      );
      throw error;
    }
  }

  return { ok: true, name: job.name, data: job.data };
}

function main() {
  const REDIS_URL = process.env.REDIS_URL;
  const REDIS_HOST = process.env.REDIS_HOST ?? '127.0.0.1';
  const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);
  const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
  const REDIS_DB = Number(process.env.REDIS_DB ?? 0);
  const queueName = process.env.BULLMQ_QUEUE ?? 'default';

  const connection: ConnectionOptions = REDIS_URL
    ? { url: REDIS_URL }
    : {
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD || undefined,
        db: REDIS_DB,
      };

  const worker = new Worker(queueName, handleWorkerJob, {
    connection,
    removeOnComplete: { count: 100 },
    removeOnFail: { age: 24 * 3600 },
  });

  worker.on('completed', (job) => {
    process.stdout.write(`[worker] completed ${job.id} ${job.name}\n`);
  });
  worker.on('failed', (job, err) => {
    process.stderr.write(
      `[worker] failed ${job?.id} ${job?.name}: ${err.message}\n`,
    );
  });

  process.stdout.write(`[worker] started for queue "${queueName}"\n`);
}

if (require.main === module) {
  main();
}
