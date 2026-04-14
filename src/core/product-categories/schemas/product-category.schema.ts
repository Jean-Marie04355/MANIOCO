import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Store } from '../../store/schemas/store.schema';

export type ProductCategoryDocument = ProductCategory & Document;

@Schema({ timestamps: true })
export class ProductCategory {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Store', required: false })
  storeId: string;



  @Prop()
  deletedAt: Date;

}

export const ProductCategorySchema = SchemaFactory.createForClass(ProductCategory);
ProductCategorySchema.index({ name: 1, storeId: 1 }, { unique: true });


// Align the 'id' property with TypeORM
ProductCategorySchema.virtual('id').get(function () {
  return this._id.toHexString();
});
ProductCategorySchema.set('toJSON', { virtuals: true });
ProductCategorySchema.set('toObject', { virtuals: true });
