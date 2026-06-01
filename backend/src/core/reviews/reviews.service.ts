import { Injectable, Inject } from '@nestjs/common';
import { IBaseRepository } from '../../common/interfaces/base-repository.interface';
import { Review } from './review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject('REVIEW_REPOSITORY')
    private readonly reviewRepo: IBaseRepository<Review>,
  ) {}

  async createReview(userId: string, userName: string, rating: number, comment: string, profilePhoto?: string) {
    return this.reviewRepo.create({
      userId,
      userName,
      profilePhoto,
      rating,
      comment,
    });
  }

  async findAll() {
    const reviews = await this.reviewRepo.find();
    return reviews.map((review: any) => ({
      id: review.id,
      userName: review.userName,
      profilePhoto: review.profilePhoto,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    }));
  }
}
