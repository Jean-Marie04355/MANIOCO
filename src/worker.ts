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
      // Infrastructure worker: brancher ici les jobs OTP, S3, etc.
      if (job.name === 'send-otp-email') {
        const { email, otpCode } = job.data;
        // eslint-disable-next-line no-console
        console.log('\n==========================================');
        console.log(`📧 [EMAIL SIMULÉ]`);
        console.log(`Destinataire : ${email}`);
        console.log(`Code OTP     : ${otpCode}`);
        console.log('==========================================\n');
        return { ok: true, emailSent: true };
      }

      return { ok: true, name: job.name, data: job.data };
    },
    { connection },
  );

  worker.on('completed', (job) => {
    // eslint-disable-next-line no-console
    console.log(`[worker] completed ${job.id} ${job.name}`);
  });
  worker.on('failed', (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`[worker] failed ${job?.id} ${job?.name}`, err);
  });

  // eslint-disable-next-line no-console
  console.log(`[worker] started for queue "${queueName}"`);
}

void main();

