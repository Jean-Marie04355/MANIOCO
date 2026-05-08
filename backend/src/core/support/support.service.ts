import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';
import { Ticket, TicketStatus } from './ticket.entity';
import { TicketMessage } from './ticket-message.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';

@Injectable()
export class SupportService {
  constructor(
    @Inject('TICKET_REPOSITORY')
    private readonly ticketRepository: IBaseRepository<Ticket>,
    @Inject('TICKET_MESSAGE_REPOSITORY')
    private readonly ticketMessageRepository: IBaseRepository<TicketMessage>,
  ) {}

  async createTicket(
    sellerId: string,
    createTicketDto: CreateTicketDto,
  ): Promise<Ticket> {
    const { subject, category, message } = createTicketDto;

    // 1. Create the ticket
    const ticket = await this.ticketRepository.create({
      subject,
      category,
      sellerId,
      status: TicketStatus.OPEN,
    });

    // 2. Create the initial message
    await this.ticketMessageRepository.create({
      ticketId: ticket.id,
      senderId: sellerId,
      message,
    });

    return ticket;
  }

  async getSellerTickets(sellerId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({ sellerId });
  }

  async getAllTickets(): Promise<Ticket[]> {
    return this.ticketRepository.find({ relations: ['seller'] } as any);
  }

  async getTicketDetails(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ id });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    // Attach messages (simplistic relation loading since IBaseRepository might not support relations directly)
    const messages = await this.ticketMessageRepository.find({ ticketId: id });

    // Sort messages by creation date (separate statement to avoid mutation warning)
    const sortedMessages = [...messages].sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    ticket.messages = sortedMessages;

    return ticket;
  }

  async addMessage(
    ticketId: string,
    senderId: string,
    createMessageDto: CreateTicketMessageDto,
  ): Promise<TicketMessage> {
    const ticket = await this.ticketRepository.findOne({ id: ticketId });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    const message = await this.ticketMessageRepository.create({
      ticketId,
      senderId,
      message: createMessageDto.message,
    });

    // Auto-update ticket status if it was CLOSED and a seller replies? Or if admin replies?
    // We can keep it simple: just add the message.
    return message;
  }

  async updateTicketStatus(id: string, status: TicketStatus): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ id });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    await this.ticketRepository.update(id, { status });
    return this.getTicketDetails(id);
  }

  async countActiveTickets(): Promise<number> {
    const activeStatuses = new Set([
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
    ]);
    const tickets = await this.ticketRepository.find();
    // On filtre manuellement car le dépôt peut varier (SQL/NoSQL)
    return tickets.filter((t: any) => activeStatuses.has(t.status)).length;
  }
}
