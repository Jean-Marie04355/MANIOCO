import { Injectable, Inject } from '@nestjs/common';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';
import { Notification } from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject('NOTIFICATION_REPOSITORY')
    private readonly repo: IBaseRepository<Notification>,
  ) {}

  async create(createDto: CreateNotificationDto) {
    return this.repo.create(createDto);
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
    const unread = await this.repo.find({ where: { userId, isRead: false } } as any);
    for (const notif of unread) {
      await this.repo.update(notif.id, { isRead: true });
    }
    return { success: true, count: unread.length };
  }

  async countUnread(userId: string): Promise<{ count: number }> {
    const unread = await this.repo.find({ where: { userId, isRead: false } } as any);
    return { count: unread.length };
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }
}
