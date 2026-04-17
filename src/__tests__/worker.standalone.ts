import 'dotenv/config';
import { Worker, type ConnectionOptions, type Job } from 'bullmq';

export async function handleWorkerJob(job: Job) {
  const log = (msg: string) => process.stdout.write(`${msg}\n`);
  
  if (job.name === 'send-otp-email') {
    const { email } = job.data;
    log('\n==========================================');
    log(`📧 [SIMULATED EMAIL]`);
    const maskedEmail = email ? email.replace(/(.{3}).*@/, '$1***@') : 'unknown';
    log(`To           : ${maskedEmail}`);
    log(`Status       : OTP Sent`);
    log('==========================================\n');
    return { ok: true, emailSent: true };
  }

  if (job.name === 'send-order-confirmation') {
    const { email, orderId } = job.data;
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
}

function main() {
  const REDIS_URL = process.env.REDIS_URL;
  const REDIS_HOST = process.env.REDIS_HOST ?? '127.0.0.1';
  const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);
  const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
  const REDIS_DB = Number(process.env.REDIS_DB ?? 0);
  const queueName = process.env.BULLMQ_QUEUE ?? 'default';

  const connection: ConnectionOptions = REDIS_URL ? { url: REDIS_URL } : {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD || undefined,
    db: REDIS_DB,
  };

  const worker = new Worker(queueName, handleWorkerJob, { connection });

  worker.on('completed', (job) => {
    process.stdout.write(`[worker] completed ${job.id} ${job.name}\n`);
  });
  worker.on('failed', (job, err) => {
    process.stderr.write(`[worker] failed ${job?.id} ${job?.name}: ${err.message}\n`);
  });

  process.stdout.write(`[worker] started for queue "${queueName}"\n`);
}

if (require.main === module) {
  main();
}
