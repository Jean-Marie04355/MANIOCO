import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { WsJwtGuard } from './ws-jwt.guard';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.CORS_ORIGIN || false,

    credentials: true,
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_conversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string },
  ) {
    await client.join(`conversation_${body.conversationId}`);
    return { event: 'joined', data: { conversationId: body.conversationId } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('ping')
  ping(
    @ConnectedSocket() client: Socket & { user?: any },
    @MessageBody() body: unknown,
  ) {
    return {
      event: 'pong',
      data: {
        ok: true,
        received: body ?? null,
        user: client.user ?? null,
        ts: Date.now(),
      },
    };
  }
}

