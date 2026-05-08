import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enum/role.enum';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Récupérer mes conversations' })
  getConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getConversations(user);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: "Récupérer les messages d'une conversation" })
  getMessages(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getMessages(id, user);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Envoyer un message' })
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      conversationId?: string;
      customerId?: string;
      text: string;
      image?: string;
    },
  ) {
    return this.chatService.sendMessage(
      user.userId,
      body.conversationId,
      body.text,
      body.image,
      body.customerId,
    );
  }

  @Post('conversations/init')
  @ApiOperation({ summary: 'Initialiser une conversation avec une boutique' })
  initConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { storeId: string },
  ) {
    return this.chatService.findOrCreateConversation(user.userId, body.storeId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Obtenir le nombre de messages non lus' })
  getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getUnreadCount(user);
  }

  @Patch('conversations/:id/read')
  @ApiOperation({
    summary: "Marquer les messages d'une conversation comme lus",
  })
  markConversationAsRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chatService.markConversationAsRead(id, user);
  }

  @Patch('conversations/:id/unread')
  @ApiOperation({
    summary: "Marquer les messages d'une conversation comme non lus",
  })
  markConversationAsUnread(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chatService.markConversationAsUnread(id, user);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Supprimer une conversation' })
  deleteConversation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chatService.deleteConversation(id, user);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Supprimer un message' })
  deleteMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chatService.deleteMessage(id, user);
  }

  @Get('admin/conversation')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Récupérer une conversation entre un client et une boutique (Admin)',
  })
  async getAdminConversation(
    @Query('customerId') customerId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.chatService.getConversationByParticipants(customerId, storeId);
  }
}
