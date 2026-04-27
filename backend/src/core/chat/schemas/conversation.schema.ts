import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  customerId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Store', required: true })
  storeId: string;

  @Prop()
  lastMessageText: string;

  @Prop()
  lastMessageAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ConversationSchema.set('toJSON', { virtuals: true });
ConversationSchema.set('toObject', { virtuals: true });
