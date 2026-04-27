import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { TicketStatus } from './ticket.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a new support ticket (Seller)' })
  async create(@Request() req: any, @Body() createTicketDto: CreateTicketDto) {
    return this.supportService.createTicket(req.user.userId || req.user.id, createTicketDto);
  }

  @Get('tickets/my-tickets')
  @ApiOperation({ summary: 'Get all tickets for the authenticated seller' })
  async getMyTickets(@Request() req: any) {
    return this.supportService.getSellerTickets(req.user.userId || req.user.id);
  }

  @Get('tickets/all')
  @ApiOperation({ summary: 'Get all tickets in the system (Admin)' })
  async getAllTickets() {
    // Note: Add RoleGuard here for real production to restrict to ADMIN
    return this.supportService.getAllTickets();
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket details with messages' })
  async getTicketDetails(@Param('id') id: string) {
    return this.supportService.getTicketDetails(id);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add a message to a ticket' })
  async addMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() createMessageDto: CreateTicketMessageDto,
  ) {
    return this.supportService.addMessage(id, req.user.userId || req.user.id, createMessageDto);
  }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Update ticket status (Admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
  ) {
    return this.supportService.updateTicketStatus(id, status);
  }
}
