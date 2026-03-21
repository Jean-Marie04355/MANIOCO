import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../../common/enum/role.enum';

export type UserDocument = User & Document;

@Schema({ collection: 'users' })
export class User {
  @Prop()
  name: string;

  @Prop({ unique: true })
  email: string;

  @Prop()
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.CLIENT })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
