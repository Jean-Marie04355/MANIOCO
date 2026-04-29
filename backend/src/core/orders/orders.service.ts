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
import { User } from '../users/user.entity';
import { OrderStatus } from '../../common/enum/order-status.enum';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../../common/enum/role.enum';
import { StoreService } from '../store/store.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { SupportService } from '../support/support.service';

@Injectable()
export class OrdersService {
  constructor(
    @Inject('ORDER_REPOSITORY')
    private readonly orderRepository: IBaseRepository<Order>,
    @Inject('STORE_REPOSITORY')
    private readonly storeRepository: IBaseRepository<Store>,
    @Inject('PRODUCT_REPOSITORY')
    private readonly productRepository: IBaseRepository<Product>,
    @Inject('USER_REPOSITORY')
    private readonly userRepository: IBaseRepository<User>,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    private readonly storeService: StoreService,
    private readonly notificationsService: NotificationsService,
    private readonly supportService: SupportService,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
  ): Promise<{ order: Order; paymentUrl: string }> {
    // 1. Check if the store exists and has a payout account
    const store = await this.storeRepository.findOne({
      id: createOrderDto.storeId,
    } as object);
    
    if (!store) {
      throw new NotFoundException(`Store not found`);
    }

    if (!store.payoutAccountId) {
      throw new BadRequestException(
        `This store is not yet configured to receive payments. The seller must provide a FedaPay subaccount ID.`,
      );
    }

    // 2. Validate products and recalculate the actual total amount
    let validatedTotalAmount = 0;
    const validatedItems: any[] = [];
    
    const UNIT_FACTORS: Record<string, number> = {
      'Sac': 50,
      'Demi-sac': 25,
      'Kg': 1,
      'Demi-kg': 0.5
    };

    for (const item of createOrderDto.items) {
      const product = await this.productRepository.findOne({
        id: item.productId,
      } as object);

      if (!product) {
        throw new BadRequestException(
          `Product with ID ${item.productId} does not exist.`,
        );
      }

      // Check if the product belongs to the store
      if (String(product.storeId) !== String(createOrderDto.storeId)) {
        throw new BadRequestException(
          `The product ${product.name} does not belong to this store.`,
        );
      }

      // Check stock based on unit conversion
      const factor = UNIT_FACTORS[item.unit] || 1;
      const totalWeightNeeded = item.quantity * factor;

      if (product.stock < totalWeightNeeded) {
        throw new BadRequestException(
          `Stock insuffisant pour le produit ${product.name} (Disponible: ${product.stock} kg, Demandé: ${totalWeightNeeded} kg)`,
        );
      }

      // Calculate price based on the weight requested
      const basePricePerKg = Number(product.price);
      const priceForRequestedUnit = basePricePerKg * factor;
      const itemTotalCost = priceForRequestedUnit * item.quantity;
      
      validatedTotalAmount += itemTotalCost;

      validatedItems.push({
        ...item,
        productName: product.name,
        productImage: product.image,
        price: priceForRequestedUnit, // Save the calculated price for the specific unit (e.g., 30000 for 1 Sac)
        unit: item.unit,
      });
    }

    // 3. Calculate platform commission (default 10%)
    const DEFAULT_COMMISSION_RATE = 10.0;
    const commissionAmount = (validatedTotalAmount * DEFAULT_COMMISSION_RATE) / 100;

    // 4. Create the order in the database
    const orderData = {
      ...createOrderDto,
      totalAmount: validatedTotalAmount,
      commissionRate: DEFAULT_COMMISSION_RATE,
      commissionAmount: commissionAmount,
      items: validatedItems,
    };

    const order = await this.orderRepository.create(orderData);

    // Notify the seller and admins

    try {
      // Notify Seller
      await this.notificationsService.create({
        userId: store.ownerId,
        type: NotificationType.ORDER,
        title: 'Nouvelle commande',
        message: `Vous avez reçu une nouvelle commande de ${validatedTotalAmount.toLocaleString()} FCFA.`,
        metadata: JSON.stringify({ orderId: order.id }),
      });

      // Notify Admins
      this.notifyAdminsOfNewOrder(order, validatedTotalAmount);
    } catch (error) {
      console.error('Notification error:', error);
    }

    // 5. Update stocks
    for (const item of validatedItems) {
      const factor = UNIT_FACTORS[item.unit] || 1;
      const totalWeightToDeduct = item.quantity * factor;
      
      const product = await this.productRepository.findOne({ id: item.productId } as object);
      await this.productRepository.update(product.id, {
        stock: product.stock - totalWeightToDeduct,
      });
    }

    try {
      // 6. Initiate payment
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

  private async notifyAdminsOfNewOrder(order: Order, amount: number) {
    try {
      const admins = await this.userRepository.find({
        where: [
          { role: UserRole.ADMIN },
          { role: UserRole.SUPER_ADMIN }
        ]
      } as any);

      for (const admin of admins) {
        await this.notificationsService.create({
          userId: admin.id,
          type: NotificationType.ORDER,
          title: 'Nouvelle vente Afrigari',
          message: `Une commande de ${amount.toLocaleString()} FCFA vient d'être passée (#${order.id.split('-')[0]}).`,
          metadata: JSON.stringify({ orderId: order.id })
        });
      }
    } catch (error) {
      console.error('Failed to notify admins of new order', error);
    }
  }

  /**
   * Restores product stock for a given order
   */
  async restoreStock(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({ id: orderId } as object);
    if (!order?.items) return;

    for (const item of order.items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      } as object);
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
    const order = await this.orderRepository.findOne({ id } as object);
    if (!order || order.status === OrderStatus.CANCELLED) return order;

    await this.orderRepository.update(id, { status: OrderStatus.CANCELLED });
    await this.restoreStock(id);
    
    return this.orderRepository.findOne({ id } as object);
  }

  async findAll(user: AuthenticatedUser): Promise<Order[]> {
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return this.orderRepository.find({
        relations: ['customer', 'store'],
        order: { createdAt: 'DESC' }
      } as any);
    }

    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      return this.orderRepository.find({ 
        where: { storeId: store.id },
        relations: ['customer']
      } as object);
    }

    return this.orderRepository.find({ where: { customerId: user.userId }, relations: ['store'] } as object);
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<Order | null> {
    const order = await this.orderRepository.findOne({ id, relations: ['customer', 'store'] } as object);
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
      return this.orderRepository.find({ where: { customerId } } as object);
    }
    throw new ForbiddenException('You do not have access to these orders');
  }

  async findByStore(storeId: string, user: AuthenticatedUser): Promise<Order[]> {
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return this.orderRepository.find({ where: { storeId } } as object);
    }

    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      if (store.id !== storeId) {
        throw new ForbiddenException('You do not have access to these orders');
      }
      return this.orderRepository.find({ 
        where: { storeId },
        relations: ['customer']
      } as object);
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
    return this.orderRepository.findOne({ id } as object);
  }

  /**
   * Internal method to update order status without permission checks.
   * Used by payment webhooks and other system-level operations.
   */
  async updateStatusInternal(id: string, status: OrderStatus): Promise<Order | null> {
    await this.orderRepository.update(id, { status });
    return this.orderRepository.findOne({ id } as object);
  }

  async getAdminDashboardStats() {
    const orders = await this.orderRepository.find();
    const users = await this.userRepository.find();
    
    const paidStatuses = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED];
    
    const totalSalesCount = orders.filter(o => paidStatuses.includes(o.status)).length;
    const totalRevenue = orders
      .filter(o => paidStatuses.includes(o.status))
      .reduce((sum, o) => {
        const amount = Number(o.commissionAmount);
        // Fallback: if commissionAmount is missing/0 but we have a totalAmount, assume 10%
        const actualCommission = amount > 0 ? amount : (Number(o.totalAmount || 0) * 0.10);
        return sum + actualCommission;
      }, 0);

    const sellersCount = users.filter(u => u.role === UserRole.VENDEUR).length;
    const pendingKycCount = users.filter(u => u.kycStatus === 'PENDING').length;
    const activeTicketsCount = await this.supportService.countActiveTickets();

    // Calcul de l'historique des revenus sur les 15 derniers jours
    const revenueHistory = [];
    const now = new Date();
    for (let i = 14; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - i);
      const dateStr = targetDate.toISOString().split('T')[0];

      const dayRevenue = orders
        .filter(o => {
          const isPaid = paidStatuses.includes(o.status);
          const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
          return isPaid && orderDate === dateStr;
        })
        .reduce((sum, o) => {
          const amount = Number(o.commissionAmount);
          const actualCommission = amount > 0 ? amount : (Number(o.totalAmount || 0) * 0.10);
          return sum + actualCommission;
        }, 0);

      revenueHistory.push({ date: dateStr, amount: dayRevenue });
    }

    return {
      totalRevenue,
      totalSalesCount,
      customersCount: users.filter(u => u.role === UserRole.CLIENT).length,
      sellersCount,
      pendingKycCount,
      activeTicketsCount,
      totalUsers: users.length,
      revenueHistory
    };
  }
}
