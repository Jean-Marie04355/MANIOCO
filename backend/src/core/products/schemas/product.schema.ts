import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ProductCategory } from '../../product-categories/schemas/product-category.schema';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 'FCFA' })
  currency: string;

  @Prop({ default: 0 })
  stock: number;

  @Prop()
  description: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ProductCategory',
    required: true,
  })
  category: ProductCategory;

  @Prop()
  deletedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Auto-populate category for NoSQL consistency with SQL eager loading
ProductSchema.pre(['find', 'findOne'], function () {
  this.populate('category');
});

// Align the 'id' property with TypeORM
ProductSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });
