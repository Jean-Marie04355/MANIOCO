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

function extractToken(client: Socket): string | null {
  const authToken = client.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.trim() !== '') {
    return authToken;
  }

  const header = client.handshake.headers?.authorization;
  if (typeof header === 'string') {
    const parts = header.trim().split(/\s+/);
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
  }

  return null;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = extractToken(client);
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
}

