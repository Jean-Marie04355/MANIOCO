import {
  Injectable,
  Inject,
  NotFoundException,
  forwardRef,
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
    conversationId?: string,
    text?: string,
    image?: string,
    customerId?: string,
  ): Promise<Message> {
    try {
      let finalConversationId = conversationId;

      // Si on n'a pas de conversationId, on essaie de la trouver ou la créer via le customerId
      if (!finalConversationId && customerId) {
        const store = await this.storeService.findByOwnerId(senderId);
        const conversation = await this.findOrCreateConversation(
          customerId,
          store.id,
        );
        finalConversationId = conversation.id;
      }

      if (!finalConversationId) {
        throw new NotFoundException(
          'Conversation introuvable ou impossible à créer',
        );
      }

      const conversation = await this.conversationRepo.findOne({
        id: finalConversationId,
      } as object);
      if (!conversation) {
        throw new NotFoundException('Conversation introuvable');
      }

      const message = await this.messageRepo.create({
        conversationId: finalConversationId,
        senderId,
        text,
        image,
      } as object as Partial<Message>);

      // Update conversation last message
      await this.conversationRepo.update(finalConversationId, {
        lastMessageText: text || 'Image',
        lastMessageAt: new Date(),
      } as object as Partial<Conversation>);

      // Broadcast message via WebSocket
      if (this.realtimeGateway.server) {
        this.realtimeGateway.server
          .to(`conversation_${finalConversationId}`)
          .emit('new_message', message);
      }
      return message;
    } catch (error: any) {
      console.error('sendMessage ERROR:', error);
      throw new NotFoundException(error.message || 'Error creating message');
    }
  }

  async getConversations(user: AuthenticatedUser): Promise<Conversation[]> {
    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      return this.conversationRepo.find({
        where: { storeId: store.id },
        relations: ['customer'],
        order: { lastMessageAt: 'DESC' },
      } as object);
    }

    return this.conversationRepo.find({
      where: { customerId: user.userId },
      relations: ['store'],
      order: { lastMessageAt: 'DESC' },
    } as object);
  }

  async getMessages(
    conversationId: string,
    user: AuthenticatedUser,
  ): Promise<Message[]> {
    console.log('getMessages called with conversationId:', conversationId);
    const messages = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      relations: ['sender'],
    } as object);
    console.log('getMessages found:', messages.length, 'messages');
    return messages;
  }

  async getUnreadCount(user: AuthenticatedUser): Promise<number> {
    const conversations = await this.getConversations(user);
    const conversationIds = conversations.map((c) => c.id);

    if (conversationIds.length === 0) return 0;

    let count = 0;
    for (const convId of conversationIds) {
      const messages = await this.messageRepo.find({
        where: { conversationId: convId, isRead: false },
      } as object);
      count += messages.filter((m) => m.senderId !== user.userId).length;
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
      if (msg.senderId !== user.userId) {
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
      const lastMsg = receivedMessages[receivedMessages.length - 1];
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
}
