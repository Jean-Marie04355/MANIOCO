import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StoreDocument = Store & Document;

@Schema({ collection: 'stores' })
export class Store {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  localisation: string;

  @Prop({ required: true })
  phone: string;
}

export const StoreSchema = SchemaFactory.createForClass(Store);