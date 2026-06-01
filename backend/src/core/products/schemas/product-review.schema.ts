import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProductReviewDocument = ProductReview & Document;

@Schema({ timestamps: true })
export class ProductReview {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment: string;
}

export const ProductReviewSchema = SchemaFactory.createForClass(ProductReview);

// Align virtual id
ProductReviewSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
ProductReviewSchema.set('toJSON', { virtuals: true });
ProductReviewSchema.set('toObject', { virtuals: true });
