import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import type { IUserRepository } from '../interfaces/user-repository.interface';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
// NoSQL Implementation (MongoDB) using Mongoose
export class MongoUserRepository implements IUserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: CreateUserDto): Promise<any> {
    const createdUser = new this.userModel(data);
    return createdUser.save();
  }

  async findAll(): Promise<any[]> {
    return this.userModel.find().exec();
  }

  async findById(id: number): Promise<any | null> {
    // Note: MongoDB ID is an ObjectId/string by default, 
    // but if the schema uses a number, we keep id
    return this.userModel.findOne({ id }).exec();
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: number, data: Partial<CreateUserDto>): Promise<void> {
    await this.userModel.updateOne({ id }, { $set: data }).exec();
  }

  async delete(id: number): Promise<void> {
    await this.userModel.deleteOne({ id }).exec();
  }
}
