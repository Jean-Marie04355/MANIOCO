import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Store } from '../../store/schemas/store.schema';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Store', required: false })
  storeId: string;



  @Prop()
  deletedAt: Date;

}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ name: 1, storeId: 1 }, { unique: true });


// Align the 'id' property with TypeORM
CategorySchema.virtual('id').get(function () {
  return this._id.toHexString();
});
CategorySchema.set('toJSON', { virtuals: true });
CategorySchema.set('toObject', { virtuals: true });
