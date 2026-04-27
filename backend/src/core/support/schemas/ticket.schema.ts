import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'tickets' })
export class Ticket extends Document {
  @Prop({ required: true })
  subject: string;

  @Prop()
  category: string;

  @Prop({ default: 'OPEN', enum: ['OPEN', 'IN_PROGRESS', 'CLOSED'] })
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  sellerId: string;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

TicketSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

TicketSchema.set('toJSON', { virtuals: true });
TicketSchema.set('toObject', { virtuals: true });
