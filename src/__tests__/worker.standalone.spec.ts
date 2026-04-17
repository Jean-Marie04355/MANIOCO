import { handleWorkerJob } from './worker.standalone';

describe('Worker Standalone', () => {
  it('should handle send-otp-email job', async () => {
    const job = {
      name: 'send-otp-email',
      data: { email: 'test@example.com', otpCode: '123456' },
    };
    const result = await handleWorkerJob(job as any);
    expect(result).toEqual({ ok: true, emailSent: true });
  });

  it('should handle send-order-confirmation job', async () => {
    const job = {
      name: 'send-order-confirmation',
      data: { email: 'order@example.com', orderId: 'ORD-1', totalAmount: 500, items: [] },
    };
    const result = await handleWorkerJob(job as any);
    expect(result).toEqual({ ok: true, emailSent: true });
  });

  it('should handle unknown jobs', async () => {
    const job = {
      name: 'unknown-job',
      data: { foo: 'bar' },
    };
    const result = await handleWorkerJob(job as any);
    expect(result.ok).toBe(true);
    expect(result.name).toBe('unknown-job');
  });

  it('should handle missing email in masked log (coverage fallback)', async () => {
    const job = {
      name: 'send-otp-email',
      data: { email: null },
    };
    const result = await handleWorkerJob(job as any);
    expect(result.ok).toBe(true);
  });
});
