import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
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
  private readonly logger = new Logger(OrdersService.name);

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
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
  ): Promise<{ order: Order; paymentUrl: string }> {
    const store = await this.validateStore(createOrderDto.storeId);
    const { validatedTotalAmount, validatedItems } =
      await this.validateAndCalculateItems(createOrderDto);

    const DEFAULT_COMMISSION_RATE = 10;
    const commissionAmount =
      (validatedTotalAmount * DEFAULT_COMMISSION_RATE) / 100;

    const orderData = {
      ...createOrderDto,
      status: OrderStatus.PENDING,
      totalAmount: validatedTotalAmount,
      commissionRate: DEFAULT_COMMISSION_RATE,
      commissionAmount: commissionAmount,
      items: validatedItems,
      shippingAddress: createOrderDto.shippingAddress,
      shippingPhone: createOrderDto.shippingPhone,
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

      // Initialize Chat conversation automatically
      await this.chatService.findOrCreateConversation(
        order.customerId,
        store.id,
      );
    } catch (error: any) {
      this.logger.error(
        `Notification/Chat error for order ${order.id}: ${error.message}`,
        error.stack,
      );
    }

    // 5. Update stocks
    for (const item of validatedItems) {
      const product = await this.productRepository.findOne({
        id: item.productId,
      } as object);
      await this.productRepository.update(product.id, {
        stock: Number(product.stock) - Number(item.quantity),
      });
    }

    try {
      // 6. Initiate payment through FedaPay
      const paymentTx = await this.paymentsService.createTransaction(
        order,
        store.payoutAccountId,
      );

      return {
        order,
        paymentUrl: paymentTx.url,
      };
    } catch (error) {
      // If payment initiation fails, we cancel the order and restore stock.
      // The rollback must not mask the original error.
      try {
        await this.cancelOrder(order.id);
      } catch (rollbackError) {
        this.logger.error(
          `Failed to rollback order ${order.id} after payment initiation error`,
          rollbackError instanceof Error
            ? rollbackError.stack
            : String(rollbackError),
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Order creation/payment failed for store ${store.id}`,
        error instanceof Error ? error.stack : errorMessage,
      );
      throw new BadRequestException(
        `Unable to initiate payment: ${errorMessage}. The order has been cancelled and stock restored.`,
      );
    }
  }

  private async notifyAdminsOfNewOrder(order: Order, amount: number) {
    try {
      const admins = await this.userRepository.find({
        where: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }],
      } as any);

      for (const admin of admins) {
        await this.notificationsService.create({
          userId: admin.id,
          type: NotificationType.ORDER,
          title: 'Nouvelle vente Afrigari',
          message: `Une commande de ${amount.toLocaleString()} FCFA vient d'être passée (#${order.id.split('-')[0]}).`,
          metadata: JSON.stringify({ orderId: order.id }),
        });
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to notify admins of new order ${order.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  async restoreStock(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    } as any);
    if (!order?.items) return;

    const UNIT_FACTORS: Record<string, number> = {
      Sac: 50,
      'Demi-sac': 25,
      Kg: 1,
      'Demi-kg': 0.5,
    };

    for (const item of order.items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      } as any);

      if (product) {
        const factor = UNIT_FACTORS[item.unit] || 1;
        const totalWeightToRestore = item.quantity * factor;

        await this.productRepository.update(product.id, {
          stock: Number(product.stock) + totalWeightToRestore,
        });
      }
    }
  }

  /**
   * Cancels an order and restores its stock
   */
  async cancelOrder(id: string, reason?: string): Promise<Order | null> {
    const order = await this.orderRepository.findOne({ where: { id } } as any);
    if (!order || order.status === OrderStatus.CANCELLED) return order;

    await this.orderRepository.update(id, {
      status: OrderStatus.CANCELLED,
      cancellationReason: reason || 'Non spécifiée',
    });
    await this.restoreStock(id);

    // Notify the customer about the cancellation
    try {
      await this.notificationsService.create({
        userId: order.customerId,
        type: NotificationType.ORDER,
        title: 'Commande annulée',
        message: `Votre commande #${order.id.split('-')[0]} a été annulée. Motif : ${reason || 'Non spécifié'}.`,
        metadata: JSON.stringify({
          orderId: order.id,
          status: OrderStatus.CANCELLED,
        }),
      });
    } catch (e: any) {
      this.logger.error(
        `Failed to notify customer of cancellation for order ${id}: ${e.message}`,
        e.stack,
      );
    }

    return this.orderRepository.findOne({ where: { id } } as any);
  }

  async findAll(user: AuthenticatedUser): Promise<Order[]> {
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return this.orderRepository.find({
        relations: ['customer', 'store'],
        order: { createdAt: 'DESC' },
      } as any);
    }

    if (user.role === UserRole.VENDEUR) {
      try {
        const store = await this.storeService.findByOwnerId(user.userId);
        return this.orderRepository.find({
          where: { storeId: store.id },
          relations: ['customer'],
          order: { createdAt: 'DESC' },
        } as any);
      } catch (error: any) {
        this.logger.warn(
          `No store found for vendor ${user.userId}, returning empty orders list: ${error.message}`,
        );
        return [];
      }
    }

    return this.orderRepository.find({
      where: { customerId: user.userId },
      relations: ['store'],
      order: { createdAt: 'DESC' },
    } as any);
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'store'],
    } as any);

    if (!order) {
      throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
    }

    // Security check
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return order;
    }

    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      if (String(order.storeId) !== String(store.id)) {
        this.logger.warn(
          `Access denied for vendor ${user.userId} to order ${id}. Order storeId: ${order.storeId}, Vendor storeId: ${store.id}`,
        );
        throw new ForbiddenException('You do not have access to this order');
      }
      return order;
    }

    if (String(order.customerId) !== String(user.userId)) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  async findByCustomer(
    customerId: string,
    user: AuthenticatedUser,
  ): Promise<Order[]> {
    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN ||
      user.userId === customerId
    ) {
      return this.orderRepository.find({
        where: { customerId },
        relations: ['store'],
        order: { createdAt: 'DESC' },
      } as any);
    }
    throw new ForbiddenException('You do not have access to these orders');
  }

  async findByStore(
    storeId: string,
    user: AuthenticatedUser,
  ): Promise<Order[]> {
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
        relations: ['customer'],
        order: { createdAt: 'DESC' },
      } as any);
    }

    throw new ForbiddenException('You do not have access to these orders');
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    user: AuthenticatedUser,
    reason?: string,
  ): Promise<Order | null> {
    this.logger.log(
      `Updating status for order ${id} to ${status} by user ${user.userId}`,
    );

    // Check if order exists and user has permission
    const order = await this.findOne(id, user);

    // Only vendors (owners) and admins can update status
    if (user.role === UserRole.CLIENT) {
      throw new ForbiddenException('Clients cannot update order status');
    }

    if (status === OrderStatus.CANCELLED) {
      return this.cancelOrder(id, reason);
    }

    try {
      await this.orderRepository.update(id, { status });
      this.logger.log(`Order ${id} status updated successfully to ${status}`);

      // Notify the customer about the status update
      try {
        let statusLabel = status.toLowerCase();
        if (status === OrderStatus.PAID) statusLabel = 'confirmée';
        if (status === OrderStatus.SHIPPED) statusLabel = 'expédiée';
        if (status === OrderStatus.DELIVERED) statusLabel = 'livrée';

        await this.notificationsService.create({
          userId: order.customerId,
          type: NotificationType.ORDER,
          title: 'Mise à jour de commande',
          message: `Votre commande #${order.id.split('-')[0]} est désormais ${statusLabel}.`,
          metadata: JSON.stringify({ orderId: order.id, status }),
        });
      } catch (notifError) {
        this.logger.error(
          `Failed to notify customer for order ${id}: ${notifError.message}`,
        );
      }

      // Reload order to return updated version
      return this.findOne(id, user);
    } catch (error) {
      this.logger.error(
        `Failed to update order ${id} status: ${error.message}`,
      );
      throw new BadRequestException(
        `Erreur lors de la mise à jour du statut: ${error.message}`,
      );
    }
  }

  async findById(id: string): Promise<Order | null> {
    return this.orderRepository.findOne({ where: { id } } as any);
  }

  /**
   * Internal method to update order status without permission checks.
   * Used by payment webhooks and other system-level operations.
   */
  async updateStatusInternal(
    id: string,
    status: OrderStatus,
  ): Promise<Order | null> {
    const order = await this.orderRepository.findOne({ where: { id } } as any);
    if (!order) return null;

    await this.orderRepository.update(id, { status });

    // Notify the customer (Internal system update)
    try {
      let statusLabel = status.toLowerCase();
      if (status === OrderStatus.PAID) statusLabel = 'payée';
      if (status === OrderStatus.SHIPPED) statusLabel = 'expédiée';
      if (status === OrderStatus.DELIVERED) statusLabel = 'livrée';

      await this.notificationsService.create({
        userId: order.customerId,
        type: NotificationType.ORDER,
        title: 'Mise à jour de commande',
        message: `Votre commande #${order.id.split('-')[0]} est passée au statut : ${statusLabel}.`,
        metadata: JSON.stringify({ orderId: order.id, status }),
      });
    } catch (e: any) {
      this.logger.error(
        `Failed to send internal status notification for order ${id}: ${e.message}`,
        e.stack,
      );
    }

    return this.orderRepository.findOne({ where: { id } } as any);
  }

  async getAdminDashboardStats() {
    const paidStatuses = [
      OrderStatus.PAID,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    // 1. Total Sales Count (DB Level)
    const totalSalesCount = await this.orderRepository.count({
      where: paidStatuses.map((status) => ({ status })),
    } as any);

    // 2. Total Revenue
    // Since we don't have a sum() in IBaseRepository, we still load paid orders
    // but we filter them at the DB level to minimize memory usage.
    const paidOrders = await this.orderRepository.find({
      where: paidStatuses.map((status) => ({ status })),
      select: ['totalAmount', 'commissionAmount', 'createdAt'],
    } as any);

    const totalRevenue = paidOrders.reduce((sum, o) => {
      const amount = Number(o.commissionAmount);
      const actualCommission =
        amount > 0 ? amount : Number(o.totalAmount || 0) * 0.1;
      return sum + actualCommission;
    }, 0);

    // 3. User counts (DB Level)
    const sellersCount = await this.userRepository.count({
      where: { role: UserRole.VENDEUR },
    } as any);
    const customersCount = await this.userRepository.count({
      where: { role: UserRole.CLIENT },
    } as any);
    const totalUsers = await this.userRepository.count();
    const pendingKycCount = await this.userRepository.count({
      where: { kycStatus: 'PENDING' },
    } as any);

    // 4. Active Tickets
    const activeTicketsCount = await this.supportService.countActiveTickets();

    // 5. Revenue History (Last 15 days)
    const revenueHistory = [];
    const now = new Date();
    for (let i = 14; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - i);
      const dateStr = targetDate.toISOString().split('T')[0];

      const dayRevenue = paidOrders
        .filter(
          (o) => new Date(o.createdAt).toISOString().split('T')[0] === dateStr,
        )
        .reduce((sum, o) => {
          const amount = Number(o.commissionAmount);
          const actualCommission =
            amount > 0 ? amount : Number(o.totalAmount || 0) * 0.1;
          return sum + actualCommission;
        }, 0);

      revenueHistory.push({ date: dateStr, amount: dayRevenue });
    }

    return {
      totalRevenue,
      totalSalesCount,
      customersCount,
      sellersCount,
      pendingKycCount,
      activeTicketsCount,
      totalUsers,
      revenueHistory,
    };
  }

  private async validateStore(storeId: string): Promise<Store> {
    const store = await this.storeRepository.findOne({ id: storeId } as object);
    if (!store) {
      throw new NotFoundException(`Store not found`);
    }
    return store;
  }

  private async validateAndCalculateItems(
    createOrderDto: CreateOrderDto,
  ): Promise<{
    validatedTotalAmount: number;
    validatedItems: any[];
  }> {
    let validatedTotalAmount = 0;
    const validatedItems: any[] = [];

    const UNIT_FACTORS: Record<string, number> = {
      Sac: 50,
      'Demi-sac': 25,
      Kg: 1,
      'Demi-kg': 0.5,
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

      if (String(product.storeId) !== String(createOrderDto.storeId)) {
        throw new BadRequestException(
          `The product ${product.name} does not belong to this store.`,
        );
      }

      const requestedQuantity = Number(item.quantity);
      if (Number(product.stock) < requestedQuantity) {
        throw new BadRequestException(
          `Stock insuffisant pour le produit ${product.name} (Disponible: ${product.stock}, Demandé: ${requestedQuantity})`,
        );
      }

      const productReferenceUnit = product.unit || 'Kg';
      const referenceFactor = UNIT_FACTORS[productReferenceUnit] || 1;
      const basePricePerKg = Number(product.price) / referenceFactor;

      const requestedFactor = UNIT_FACTORS[item.unit] || 1;
      const priceForRequestedUnit = basePricePerKg * requestedFactor;

      const itemTotalCost = priceForRequestedUnit * requestedQuantity;
      validatedTotalAmount += itemTotalCost;

      validatedItems.push({
        ...item,
        productName: product.name,
        productImage: product.image,
        price: priceForRequestedUnit,
        unit: item.unit,
      });
    }

    return { validatedTotalAmount, validatedItems };
  }
}
