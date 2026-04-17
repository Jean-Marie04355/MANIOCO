import 'dotenv/config';
import { Worker, type ConnectionOptions, type Job } from 'bullmq';

function main() {
  const connection: ConnectionOptions = (() => {
    const url = process.env.REDIS_URL;
    if (url) return { url };

    const host = process.env.REDIS_HOST ?? '127.0.0.1';
    const port = Number(process.env.REDIS_PORT ?? 6379);
    const password = process.env.REDIS_PASSWORD;
    const db = Number(process.env.REDIS_DB ?? 0);
    return { host, port, password: password || undefined, db };
  })();

  const queueName = process.env.BULLMQ_QUEUE ?? 'default';

  const worker = new Worker(
    queueName,
    async (job: Job) => {
      // Infrastructure worker: register OTP, S3, etc. jobs here
      if (job.name === 'send-otp-email') {
        const { email, otpCode } = job.data;
        const log = (msg: string) => process.stdout.write(`${msg}\n`);
        log('\n==========================================');
        log(`📧 [SIMULATED EMAIL]`);
        const maskedEmail = email ? email.replace(/(.{3}).*@/, '$1***@') : 'unknown';
        log(`To           : ${maskedEmail}`);
        log(`Status       : OTP Sent`);
        log('==========================================\n');
        return { ok: true, emailSent: true };
      }

      if (job.name === 'send-order-confirmation') {
        const { email, orderId, totalAmount, items } = job.data;
        const log = (msg: string) => process.stdout.write(`${msg}\n`);
        log('\n==========================================');
        log(`📧 [COMMANDE RÉUSSIE]`);
        const maskedEmail = email ? email.replace(/(.{3}).*@/, '$1***@') : 'unknown';
        log(`To           : ${maskedEmail}`);
        log(`Commande ID  : #${orderId}`);
        log(`Status       : Confirmation Sent`);
        log('==========================================\n');
        return { ok: true, emailSent: true };
      }

      return { ok: true, name: job.name, data: job.data };
    },
    { connection },
  );

  worker.on('completed', (job) => {
    process.stdout.write(`[worker] completed ${job.id} ${job.name}\n`);
  });
  worker.on('failed', (job, err) => {
    process.stderr.write(`[worker] failed ${job?.id} ${job?.name}: ${err.message}\n`);
  });

  process.stdout.write(`[worker] started for queue "${queueName}"\n`);
}

main();

