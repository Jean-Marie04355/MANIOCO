import { Injectable, Optional, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { User as UserEntity } from './user.entity';
import { User as MongoUser, UserDocument } from './schemas/user.schema';
import { IBaseRepository, BaseRepository } from '../../database';

import { getRepositoryToken } from '@nestjs/typeorm';
import { getModelToken } from '@nestjs/mongoose';

/**
 * Universal User Repository.
 * This class handles both SQL and NoSQL.
 * We use manual tokens and @Inject to avoid crashes when one of the modules is not loaded.
 */
export class UniversalUserRepository extends BaseRepository<UserEntity | UserDocument> implements IBaseRepository<UserEntity | UserDocument> {
  constructor(engine: any) {
    super(engine);
  }

  /**
   * Specific method for users: find by email.
   * Works for both databases thanks to the universal findOneBy in BaseRepository.
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.findOneBy({ email }) as any;
  }
}
