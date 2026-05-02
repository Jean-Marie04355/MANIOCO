import { Injectable, Inject } from '@nestjs/common';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';
import { Notification } from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RealtimeGateway } from '../../libs/realtime/realtime.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject('NOTIFICATION_REPOSITORY')
    private readonly repo: IBaseRepository<Notification>,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(createDto: CreateNotificationDto) {
    const notification = await this.repo.create(createDto);
    
    // Emit real-time event via WebSocket
    if (this.realtimeGateway.server && createDto.userId) {
      this.realtimeGateway.server
        .to(`user_${createDto.userId}`)
        .emit('new_notification', notification);
    }
    
    return notification;
  }

  async findAllByUser(userId: string) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    } as any);
  }

  async markAsRead(id: string) {
    await this.repo.update(id, { isRead: true });
    return this.repo.findOne({ id } as any);
  }

  async markAllAsRead(userId: string) {
    const unread = await this.repo.find({
      where: { userId, isRead: false },
    } as any);
    for (const notif of unread) {
      await this.repo.update(notif.id, { isRead: true });
    }
    return { success: true, count: unread.length };
  }

  async countUnread(userId: string): Promise<{ count: number }> {
    const unread = await this.repo.find({
      where: { userId, isRead: false },
    } as any);
    return { count: unread.length };
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }
}
