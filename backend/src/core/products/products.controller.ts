import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enum/permission.enum';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_MANAGE)
  @ApiOperation({ summary: 'Create a new product' })
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.create(createProductDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all products, optionally filtered by storeId',
  })
  findAll(@Query('storeId') storeId?: string) {
    return this.productsService.findAll(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a product by ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_MANAGE)
  @ApiOperation({ summary: 'Update a product by ID' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.update(id, updateProductDto, user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCTS_MANAGE)
  @ApiOperation({ summary: 'Delete a product by ID' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.remove(id, user);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Retrieve all product reviews' })
  findAllReviews() {
    return this.productsService.findAllReviews();
  }

  @Post(':id/reviews')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a review to a product' })
  addReview(
    @Param('id') id: string,
    @Body('rating') rating: number,
    @Body('comment') comment: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.addReview(id, rating, comment, user);
  }
}
