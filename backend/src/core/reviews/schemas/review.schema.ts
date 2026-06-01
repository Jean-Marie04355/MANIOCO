import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop()
  profilePhoto?: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ReviewSchema.set('toJSON', { virtuals: true });
ReviewSchema.set('toObject', { virtuals: true });
