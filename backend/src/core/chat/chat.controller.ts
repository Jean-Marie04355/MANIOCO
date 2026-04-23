import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  @ApiOperation({ summary: 'Récupérer les messages d\'une conversation' })
  getMessages(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.getMessages(id, user);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Envoyer un message' })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { conversationId: string; text: string; image?: string }
  ) {
    return this.chatService.sendMessage(user.userId, body.conversationId, body.text, body.image);
  }

  @Post('conversations/init')
  @ApiOperation({ summary: 'Initialiser une conversation avec une boutique' })
  initConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { storeId: string }
  ) {
    return this.chatService.findOrCreateConversation(user.userId, body.storeId);
  }
}
