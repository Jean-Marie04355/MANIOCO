import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StoreDocument = Store & Document;

@Schema({ collection: 'stores' })
export class Store {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, required: true })
  ownerId: string;

  @Prop({ nullable: true })
  profilePhoto: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: true })
  localisation: string;

  @Prop({ required: false })
  phone: string;

  @Prop({ required: false })
  payoutAccountId: string;
}

export const StoreSchema = SchemaFactory.createForClass(Store);

// Align the 'id' property with TypeORM
StoreSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
StoreSchema.set('toJSON', { virtuals: true });
StoreSchema.set('toObject', { virtuals: true });