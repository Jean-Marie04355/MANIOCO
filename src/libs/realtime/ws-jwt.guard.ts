import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

type JwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
  userId?: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);
    
    if (!token) {
      throw new WsException('Missing auth token');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      Object.assign(client, { user: payload });
      return true;
    } catch {
      throw new WsException('Invalid auth token');
    }
  }

  private extractToken(client: Socket): string | null {
    // Priority 1: handshake.auth.token
    const auth = client.handshake.auth;
    if (auth?.token) return String(auth.token);

    // Priority 2: Authorization header
    const header = client.handshake.headers?.authorization;
    if (header?.startsWith('Bearer ')) return header.substring(7);

    return null;
  }
}

