import { Controller, Get, Patch, Param, UseGuards, Request, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread/count')
  @ApiOperation({ summary: 'Compter les notifications non lues' })
  async countUnread(@Request() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.countUnread(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer les notifications de l\'utilisateur connecté' })
  async findAll(@Request() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.findAllByUser(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une notification' })
  async remove(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }
}
