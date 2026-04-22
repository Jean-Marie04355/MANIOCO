import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true, collection: 'transactions' })
export class Transaction {
  @Prop({ type: String, required: true })
  orderId: string;

  @Prop({ type: String, unique: true, sparse: true })
  externalId: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, default: 'PENDING' })
  status: string;

  @Prop({ type: String })
  paymentMethod: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Align with TypeORM virtual id
TransactionSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
TransactionSchema.set('toJSON', { virtuals: true });
TransactionSchema.set('toObject', { virtuals: true });
