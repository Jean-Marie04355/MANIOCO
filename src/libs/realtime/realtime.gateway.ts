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
    origin: '*',
    credentials: true,
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('ping')
  ping(
    @ConnectedSocket() client: Socket & { user?: unknown },
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

