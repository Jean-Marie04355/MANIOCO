import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'ticket_messages' })
export class TicketMessage extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Ticket', required: true })
  ticketId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId: string;

  @Prop({ required: true })
  message: string;
}

export const TicketMessageSchema = SchemaFactory.createForClass(TicketMessage);

TicketMessageSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

TicketMessageSchema.set('toJSON', { virtuals: true });
TicketMessageSchema.set('toObject', { virtuals: true });
