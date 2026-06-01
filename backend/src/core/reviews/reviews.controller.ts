import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all application reviews' })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add an application review' })
  addReview(
    @Body('rating') rating: number,
    @Body('comment') comment: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviewsService.createReview(
      user.userId,
      user.name || 'Client Afrigari',
      rating,
      comment || '',
      user.profilePhoto,
    );
  }
}
