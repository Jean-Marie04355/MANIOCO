  Injectable,
  Inject,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';
import { Conversation, Message } from './entities/chat.entity';
import { StoreService } from '../store/store.service';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../../common/enum/role.enum';
import { RealtimeGateway } from '../../libs/realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject('CONVERSATION_REPOSITORY')
    private readonly conversationRepo: IBaseRepository<Conversation>,
    @Inject('MESSAGE_REPOSITORY')
    private readonly messageRepo: IBaseRepository<Message>,
    private readonly storeService: StoreService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  async findOrCreateConversation(
    customerId: string,
    storeId: string,
  ): Promise<Conversation> {
    let conversation = await this.conversationRepo.findOne({
      customerId,
      storeId,
    } as object);

    if (!conversation) {
      conversation = await this.conversationRepo.create({
        customerId,
        storeId,
        lastMessageAt: new Date(), // On initialise la date pour qu'il remonte en haut de liste
      } as object as Partial<Conversation>);
    }

    return conversation;
  }

  async sendMessage(
    senderId: string,
  async sendMessage(
    senderId: string,
    conversationId?: string,
    text?: string,
    image?: string,
    customerId?: string,
  ): Promise<Message> {
    try {
      const finalConversationId = await this.resolveConversationId(
        senderId,
        conversationId,
        customerId,
      );

      const conversation = await this.conversationRepo.findOne({
        id: finalConversationId,
      } as object);
      if (!conversation) {
        throw new NotFoundException('Conversation introuvable');
      }

      this.logger.log(`Saving message: text="${text}", image="${image}"`);
      const message = await this.messageRepo.create({
        conversationId: finalConversationId,
        senderId,
        text: text || '',
        image,
      } as object as Partial<Message>);
      this.logger.log(`Message saved with ID: ${message.id}`);

      await this.conversationRepo.update(finalConversationId, {
        lastMessageText: text || 'Image',
        lastMessageAt: new Date(),
      } as object as Partial<Conversation>);

      const recipientId = await this.notifyRecipient(
        senderId,
        conversation,
        finalConversationId,
        text,
      );

      const messageWithRelations = await this.messageRepo.findOne({
        where: { id: message.id },
        relations: ['sender'],
      } as any);

      const fullConv = await this.conversationRepo.findOne({
        where: { id: finalConversationId },
        relations: ['store', 'customer'],
      } as any);

      const sanitizedConv = { ...(fullConv || conversation) } as any;
      if (sanitizedConv.messages) delete sanitizedConv.messages;

      const normalizedMsg = {
        ...(messageWithRelations || message),
        senderId:
          message?.senderId && typeof message.senderId === 'object'
            ? (message.senderId as any).id
            : message?.senderId || senderId,
        conversation: sanitizedConv,
      };

      this.broadcastMessage(finalConversationId, recipientId, normalizedMsg);

      return normalizedMsg as Message;
    } catch (error: any) {
      this.logger.error(
        `sendMessage ERROR in conversation ${
          conversationId || customerId
        }: ${error.message}`,
      );
      throw new NotFoundException(error.message || 'Error creating message');
    }
  }

  private async resolveConversationId(
    senderId: string,
    conversationId?: string,
    customerId?: string,
  ): Promise<string> {
    if (conversationId) return conversationId;

    if (customerId) {
      const store = await this.storeService.findByOwnerId(senderId);
      const conversation = await this.findOrCreateConversation(
        customerId,
        store.id,
      );
      return conversation.id;
    }

    throw new NotFoundException(
      'Conversation introuvable ou impossible à créer',
    );
  }

  private async notifyRecipient(
    senderId: string,
    conversation: Conversation,
    finalConversationId: string,
    text?: string,
  ): Promise<string | null> {
    try {
      const store = await this.storeService.findOne(conversation.storeId);
      if (!store) return null;

      const isSellerMessage = String(senderId) === String(store.ownerId);
      const recipientId = isSellerMessage
        ? conversation.customerId
        : store.ownerId;

      await this.notificationsService.create({
        userId: recipientId,
        type: NotificationType.MESSAGE,
        title: 'Nouveau message',
        message: isSellerMessage
          ? 'Vous avez reçu une réponse du vendeur.'
          : 'Vous avez reçu un nouveau message client.',
        metadata: JSON.stringify({
          conversationId: finalConversationId,
          senderId,
        }),
      });
      return recipientId;
    } catch (e: any) {
      this.logger.error(
        `Failed to send notification for chat message in conversation ${finalConversationId}: ${e.message}`,
      );
      return null;
    }
  }

  private broadcastMessage(
    finalConversationId: string,
    recipientId: string | null,
    normalizedMsg: any,
  ): void {
    if (!this.realtimeGateway.server) return;

    this.realtimeGateway.server
      .to(`conversation_${finalConversationId}`)
      .emit('new_message', normalizedMsg);

    if (recipientId) {
      this.realtimeGateway.server
        .to(`user_${recipientId}`)
        .emit('new_message', normalizedMsg);
    }
  }

  async getConversations(user: AuthenticatedUser): Promise<Conversation[]> {
    if (user.role === UserRole.VENDEUR) {
      try {
        const store = await this.storeService.findByOwnerId(user.userId);
        if (!store) return [];
        
        return this.conversationRepo.find({
          where: { storeId: store.id },
          relations: ['customer'],
          order: { lastMessageAt: 'DESC' }
        } as any);
      } catch (e: any) {
        this.logger.error(`Error fetching conversations for seller ${user.userId}: ${e.message}`);
        return [];
      }
    }

    return this.conversationRepo.find({
      where: { customerId: user.userId },
      relations: ['store', 'store.owner'],
      order: { lastMessageAt: 'DESC' },
    } as object);
  }

  async getMessages(
    conversationId: string,
    user: AuthenticatedUser,
  ): Promise<Message[]> {
    const messages = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      relations: ['sender'],
    } as object);
    return messages.map(m => ({
      ...m,
      senderId: typeof m.senderId === 'object' ? (m.senderId as any).id : m.senderId
    })) as Message[];
  }

  async getUnreadCount(user: AuthenticatedUser): Promise<number> {
    const conversations = await this.getConversations(user);
    const conversationIds = conversations.map((c) => c.id);

    if (conversationIds.length === 0) return 0;

    let count = 0;
    for (const convId of conversationIds) {
      const messages = await this.messageRepo.find({ where: { conversationId: convId, isRead: false } } as object);
      count += messages.filter(m => {
        const sid = typeof m.senderId === 'object' ? (m.senderId as any).id : m.senderId;
        return String(sid) !== String(user.userId);
      }).length;
    }
    return count;
  }

  async markConversationAsRead(
    conversationId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const messages = await this.messageRepo.find({
      where: { conversationId, isRead: false },
    } as object);
    for (const msg of messages) {
      const sid = typeof msg.senderId === 'object' ? (msg.senderId as any).id : msg.senderId;
      if (String(sid) !== String(user.userId)) {
        await this.messageRepo.update(msg.id, { isRead: true });
      }
    }
  }

  async markConversationAsUnread(
    conversationId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const messages = await this.messageRepo.find({
      where: { conversationId, isRead: true },
    } as object);
    // On prend le dernier message reçu et on le marque comme non lu
    const receivedMessages = messages.filter((m) => m.senderId !== user.userId);
    if (receivedMessages.length > 0) {
    const lastMsg = receivedMessages.at(-1);
      await this.messageRepo.update(lastMsg.id, { isRead: false });
    }
  }

  async deleteConversation(
    conversationId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    // Supprime d'abord les messages liés (ou par cascade si configuré)
    const messages = await this.messageRepo.find({
      where: { conversationId },
    } as object);
    for (const msg of messages) {
      await this.messageRepo.delete(msg.id);
    }
    await this.conversationRepo.delete(conversationId);
  }

  async deleteMessage(
    messageId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const message = await this.messageRepo.findOne({ id: messageId } as object);
    if (!message) throw new NotFoundException('Message introuvable');
    if (message.senderId !== user.userId) {
      throw new NotFoundException(
        'Vous ne pouvez supprimer que vos propres messages',
      );
    }
    await this.messageRepo.delete(messageId);
  }

  async getConversationByParticipants(customerId: string, storeId: string): Promise<Conversation> {
    const conversation = await this.conversationRepo.findOne({
      where: { customerId, storeId },
      relations: ['customer', 'store', 'store.owner']
    } as any);
    
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable entre ces participants');
    }
    
    return conversation;
  }
}
