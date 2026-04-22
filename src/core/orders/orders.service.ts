import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  forwardRef,
} from '@nestjs/common';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';
import { Order } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentsService } from '../payments/payments.service';
import { Store } from '../store/store.entity';
import { Product } from '../products/product.entity';
import { OrderStatus } from '../../common/enum/order-status.enum';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../../common/enum/role.enum';
import { StoreService } from '../store/store.service';

@Injectable()
export class OrdersService {
  constructor(
    @Inject('ORDER_REPOSITORY')
    private readonly orderRepository: IBaseRepository<Order>,
    @Inject('STORE_REPOSITORY')
    private readonly storeRepository: IBaseRepository<Store>,
    @Inject('PRODUCT_REPOSITORY')
    private readonly productRepository: IBaseRepository<Product>,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    private readonly storeService: StoreService,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
  ): Promise<{ order: Order; paymentUrl: string }> {
    // 1. Check if the store exists and has a payout account
    const store = await this.storeRepository.findOne({
      id: createOrderDto.storeId,
    });
    if (!store) {
      throw new NotFoundException(`Store not found`);
    }

    if (!store.payoutAccountId) {
      throw new BadRequestException(
        `This store is not yet configured to receive payments.`,
      );
    }

    // 2. Validate products and recalculate the actual total amount
    let validatedTotalAmount = 0;
    const validatedItems: {
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }[] = [];
    for (const item of createOrderDto.items) {
      const product = await this.productRepository.findOne({
        id: item.productId,
      });

      if (!product) {
        throw new BadRequestException(
          `Product with ID ${item.productId} does not exist.`,
        );
      }

      // Check if the product belongs to the store
      if (
        String(product.storeId) !== String(createOrderDto.storeId)
      ) {
        throw new BadRequestException(
          `The product ${product.name} does not belong to this store.`,
        );
      }

      // Check stock
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name} (Available: ${product.stock})`,
        );
      }

      const unitPrice = Number(product.price);
      validatedTotalAmount += unitPrice * item.quantity;

      validatedItems.push({
        ...item,
        productName: product.name, // Secure the name
        price: unitPrice, // Secure the price
      });
    }

    // Overwrite the amount sent by the client with the calculated amount
    const orderData = {
      ...createOrderDto,
      totalAmount: validatedTotalAmount,
      items: validatedItems,
    };

    // 3. Create the order in the database
    const order = await this.orderRepository.create(orderData);

    // 4. Update stocks (Decrement)
    for (const item of validatedItems) {
      const product = await this.productRepository.findOne({
        id: item.productId,
      });
      await this.productRepository.update(product.id, {
        stock: product.stock - item.quantity,
      });
    }

    try {
      // 5. Initiate payment transaction
      const paymentTx = await this.paymentsService.createTransaction(
        order,
        store.payoutAccountId,
      );

      return {
        order,
        paymentUrl: paymentTx.url,
      };
    } catch (error) {
      // If payment initiation fails, we cancel the order and restore stock
      await this.cancelOrder(order.id);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Unable to initiate payment: ${errorMessage}. The order has been cancelled and stock restored.`,
      );
    }
  }

  /**
   * Restores product stock for a given order
   */
  async restoreStock(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({ id: orderId });
    if (!order?.items) return;

    for (const item of order.items) {
      const product = await this.productRepository.findOne({
        id: item.productId,
      });
      if (product) {
        await this.productRepository.update(product.id, {
          stock: product.stock + item.quantity,
        });
      }
    }
  }

  /**
   * Cancels an order and restores its stock
   */
  async cancelOrder(id: string): Promise<Order | null> {
    const order = await this.orderRepository.findOne({ id });
    if (!order || order.status === OrderStatus.CANCELLED) return order;

    await this.orderRepository.update(id, { status: OrderStatus.CANCELLED });
    await this.restoreStock(id);
    
    return this.orderRepository.findOne({ id });
  }

  async findAll(user: AuthenticatedUser): Promise<Order[]> {
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return this.orderRepository.find();
    }

    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      return this.orderRepository.find({ storeId: store.id });
    }

    return this.orderRepository.find({ customerId: user.userId });
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<Order | null> {
    const order = await this.orderRepository.findOne({ id });
    if (!order) {
      throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
    }

    // Security check
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return order;
    }

    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      if (order.storeId !== store.id) {
        throw new ForbiddenException('You do not have access to this order');
      }
      return order;
    }

    if (order.customerId !== user.userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  async findByCustomer(customerId: string, user: AuthenticatedUser): Promise<Order[]> {
    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN ||
      user.userId === customerId
    ) {
      return this.orderRepository.find({ customerId });
    }
    throw new ForbiddenException('You do not have access to these orders');
  }

  async findByStore(storeId: string, user: AuthenticatedUser): Promise<Order[]> {
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return this.orderRepository.find({ storeId });
    }

    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      if (store.id !== storeId) {
        throw new ForbiddenException('You do not have access to these orders');
      }
      return this.orderRepository.find({ storeId });
    }

    throw new ForbiddenException('You do not have access to these orders');
  }

  async updateStatus(id: string, status: OrderStatus, user: AuthenticatedUser): Promise<Order | null> {
    const order = await this.findOne(id, user); // findOne already checks permissions
    
    // Only vendors (owners) and admins can update status
    if (user.role === UserRole.CLIENT && order.customerId === user.userId) {
        throw new ForbiddenException('Clients cannot update order status');
    }

    await this.orderRepository.update(id, { status });
    return this.findOne(id, user);
  }

  async findOneById(id: string): Promise<Order | null> {
    return this.orderRepository.findOne({ id });
  }

  /**
   * Internal method to update order status without permission checks.
   * Used by payment webhooks and other system-level operations.
   */
  async updateStatusInternal(id: string, status: OrderStatus): Promise<Order | null> {
    await this.orderRepository.update(id, { status });
    return this.orderRepository.findOne({ id });
  }
}
