import { Transaction } from './transaction.entity';

describe('Transaction entity', () => {
  it('should create a Transaction instance', () => {
    const tx = new Transaction();
    tx.id = 'uuid-1';
    tx.orderId = 'order-1';
    tx.externalId = 'feda-1';
    tx.amount = 10000;
    tx.status = 'PENDING';
    tx.paymentMethod = 'mtn';
    tx.createdAt = new Date();
    tx.updatedAt = new Date();

    expect(tx.id).toBe('uuid-1');
    expect(tx.orderId).toBe('order-1');
    expect(tx.externalId).toBe('feda-1');
    expect(tx.amount).toBe(10000);
    expect(tx.status).toBe('PENDING');
    expect(tx.paymentMethod).toBe('mtn');
  });
});
