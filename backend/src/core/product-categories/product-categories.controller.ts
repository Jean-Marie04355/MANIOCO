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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enum/role.enum';

@ApiTags('Product Categories')
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(
    private readonly productCategoriesService: ProductCategoriesService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDEUR)
  @ApiOperation({ summary: 'Create a new product category' })
  create(@Body() createDto: CreateProductCategoryDto) {
    return this.productCategoriesService.create(createDto);
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDEUR)
  @ApiOperation({ summary: 'Update a product category by ID' })
  update(@Param('id') id: string, @Body() updateDto: UpdateProductCategoryDto) {
    return this.productCategoriesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDEUR)
  @ApiOperation({ summary: 'Delete a product category by ID' })
  remove(@Param('id') id: string) {
    return this.productCategoriesService.remove(id);
  }
}
