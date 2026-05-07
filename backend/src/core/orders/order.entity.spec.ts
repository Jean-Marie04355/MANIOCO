import { Order } from './order.entity';
import { OrderStatus } from '../../common/enum/order-status.enum';

describe('Order entity', () => {
  it('should create an Order instance', () => {
    const order = new Order();
    order.id = 'uuid-1';
    order.customerId = 'customer-1';
    order.storeId = 'store-1';
    order.totalAmount = 5000;
    order.status = OrderStatus.PENDING;
    order.items = [
      { productId: 'p1', productName: 'Test', quantity: 2, price: 2500, unit: 'pcs' },
    ];
    order.createdAt = new Date();
    order.updatedAt = new Date();

    expect(order.id).toBe('uuid-1');
    expect(order.customerId).toBe('customer-1');
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.items).toHaveLength(1);
    expect(order.totalAmount).toBe(5000);
  });
});
