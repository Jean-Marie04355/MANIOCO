import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'messages',
})
export class Message extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  })
  conversationId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId: string;

  @Prop({ required: true })
  text: string;

  @Prop()
  image: string;

  @Prop({ default: false })
  isRead: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

MessageSchema.set('toJSON', { virtuals: true });
MessageSchema.set('toObject', { virtuals: true });
