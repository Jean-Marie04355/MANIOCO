import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { Store } from './store.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enum/role.enum';

@ApiTags('Stores')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  @ApiOperation({ summary: 'Get all stores (can be filtered by city)' })
  @ApiResponse({
    status: 200,
    description: 'List of stores retrieved successfully.',
    type: [Store],
  })
  findAll(@Query('city') city?: string) {
    return this.storeService.findAll(city);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find stores nearby based on GPS coordinates' })
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    return this.storeService.findNearby(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : 10,
    );
  }

  @Get(':id/delivery-fee')
  @ApiOperation({
    summary: 'Calculate delivery fee from store to client position',
  })
  getDeliveryFee(
    @Param('id') id: string,
    @Query('lat') lat: number,
    @Query('lng') lng: number,
  ) {
    return this.storeService.getDeliveryFee(id, Number(lat), Number(lng));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a store by ID' })
  @ApiResponse({
    status: 200,
    description: 'Store retrieved successfully.',
    type: Store,
  })
  @ApiResponse({ status: 404, description: 'Store not found.' })
  findOne(@Param('id') id: string) {
    return this.storeService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDEUR)
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({
    status: 201,
    description: 'Store created successfully.',
    type: Store,
  })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storeService.create(createStoreDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDEUR)
  @ApiOperation({ summary: 'Update a store by ID' })
  @ApiResponse({
    status: 200,
    description: 'Store updated successfully.',
    type: Store,
  })
  @ApiResponse({ status: 404, description: 'Store not found.' })
  update(
    @Param('id') id: string,
    @Body() updateStoreDto: Partial<CreateStoreDto>,
  ) {
    return this.storeService.update(id, updateStoreDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDEUR)
  @ApiOperation({ summary: 'Delete a store by ID' })
  @ApiResponse({ status: 200, description: 'Store deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Store not found.' })
  remove(@Param('id') id: string) {
    return this.storeService.remove(id);
  }
}
