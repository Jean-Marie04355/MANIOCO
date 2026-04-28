import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards, Logger, Get, Controller } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { WsJwtGuard } from './ws-jwt.guard';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedClients = 0;

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(`Client connected: ${client.id} | Total: ${this.connectedClients}`);
    // Diffuse le nouveau compteur à TOUS les clients connectés
    this.server.emit('online-count', { count: this.connectedClients });
  }

  handleDisconnect(client: Socket) {
    this.connectedClients = Math.max(0, this.connectedClients - 1);
    this.logger.log(`Client disconnected: ${client.id} | Total: ${this.connectedClients}`);
    this.server.emit('online-count', { count: this.connectedClients });
  }

  getOnlineCount(): number {
    return this.connectedClients;
  }

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
        onlineCount: this.connectedClients,
      },
    };
  }
}

@Controller('realtime')
export class RealtimeController {
  constructor(private readonly gateway: RealtimeGateway) {}

  @Get('online-count')
  getOnlineCount() {
    return { count: this.gateway.getOnlineCount() };
  }
}
