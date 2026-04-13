import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OrderStatus } from '../../../common/enum/order-status.enum';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ type: String, required: true })
  customerId: string;

  @Prop({ type: String, required: true })
  storeId: string;

  @Prop({ type: Number, required: true })
  totalAmount: number;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Prop({ type: [{
    productId: String,
    productName: String,
    quantity: Number,
    price: Number,
  }], default: [] })
  items: any[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Align with TypeORM virtual id
OrderSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });
