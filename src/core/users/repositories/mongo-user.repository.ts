import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { MongoBaseRepository } from '../../../database/mongo/mongo-base.repository'; // ✅ corrigé
import { User as MongoUser, UserDocument } from '../schemas/user.schema';

@Injectable()
export class MongoUserRepository extends MongoBaseRepository<UserDocument> {
  constructor(
    @InjectModel(MongoUser.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    super(userModel);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.findOneBy({ email }); 
  }
}