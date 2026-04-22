import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProductCategoriesService } from './product-categories.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enum/permission.enum';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Product Categories')
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(
    private readonly productCategoriesService: ProductCategoriesService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCT_CATEGORIES_MANAGE)
  @ApiOperation({ summary: 'Create a new product category' })
  create(
    @Body() createDto: CreateProductCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productCategoriesService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all product categories' })
  findAll() {
    return this.productCategoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a product category by ID' })
  findOne(@Param('id') id: string) {
    return this.productCategoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCT_CATEGORIES_MANAGE)
  @ApiOperation({ summary: 'Update a product category by ID' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productCategoriesService.update(id, updateDto, user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.PRODUCT_CATEGORIES_MANAGE)
  @ApiOperation({ summary: 'Delete a product category by ID' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productCategoriesService.remove(id, user);
  }
}
