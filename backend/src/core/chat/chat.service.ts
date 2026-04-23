import { Injectable, Inject, NotFoundException, forwardRef } from '@nestjs/common';
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

  async findOrCreateConversation(customerId: string, storeId: string): Promise<Conversation> {
    let conversation = await this.conversationRepo.findOne({
      where: { customerId, storeId }
    } as object);

    if (!conversation) {
      conversation = await this.conversationRepo.create({
        customerId,
        storeId,
      } as object as Partial<Conversation>);
    }

    return conversation;
  }

  async sendMessage(senderId: string, conversationId: string, text: string, image?: string): Promise<Message> {
    const conversation = await this.conversationRepo.findOne({ id: conversationId } as object);
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }

    const message = await this.messageRepo.create({
      conversationId,
      senderId,
      text,
      image,
    } as object as Partial<Message>);

    // Update conversation last message
    await this.conversationRepo.update(conversationId, {
      lastMessageText: text || 'Image',
      lastMessageAt: new Date(),
    } as object as Partial<Conversation>);

    // Broadcast message via WebSocket
    if (this.realtimeGateway.server) {
      this.realtimeGateway.server
        .to(`conversation_${conversationId}`)
        .emit('new_message', message);
    }

    // 3. Notify the recipient
    try {
      const sender = await this.usersService.findOne(senderId);
      let recipientId: string;
      
      if (senderId === conversation.customerId) {
        // Customer sent to Seller
        const store = await this.storeService.findOne(conversation.storeId);
        recipientId = store.ownerId;
      } else {
        // Seller sent to Customer
        recipientId = conversation.customerId;
      }

      await this.notificationsService.create({
        userId: recipientId,
        type: NotificationType.MESSAGE,
        title: `Nouveau message de ${sender.name}`,
        message: text || 'Vous a envoyé une image',
        metadata: JSON.stringify({ conversationId, senderId }),
      });
    } catch (error) {
      console.error('Erreur lors de la création de la notification de message', error);
    }

    return message;
  }

  async getConversations(user: AuthenticatedUser): Promise<Conversation[]> {
    if (user.role === UserRole.VENDEUR) {
      const store = await this.storeService.findByOwnerId(user.userId);
      return this.conversationRepo.find({
        where: { storeId: store.id },
        relations: ['customer'],
        order: { lastMessageAt: 'DESC' }
      } as object);
    }

    return this.conversationRepo.find({
      where: { customerId: user.userId },
      relations: ['store'],
      order: { lastMessageAt: 'DESC' }
    } as object);
  }

  async getMessages(conversationId: string, user: AuthenticatedUser): Promise<Message[]> {
    // Dans une version réelle, on vérifierait que l'user appartient à la conversation
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      relations: ['sender']
    } as object);
  }
}
