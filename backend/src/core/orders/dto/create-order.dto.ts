import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { OrderStatus } from '../../../common/enum/order-status.enum';

export class OrderItemDto {
  @ApiProperty({ description: 'Product ID', example: 'PRODUCT_ID_HERE' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Product Name', example: 'Nike Shoes' })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({ description: 'Quantity', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ description: 'Unit Price', example: 5000 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    description: 'Unit of measure for the ordered quantity',
    example: 'Sac',
    enum: ['Sac', 'Demi-sac', 'Kg', 'Demi-kg'],
  })
  @IsIn(['Sac', 'Demi-sac', 'Kg', 'Demi-kg'])
  @IsNotEmpty()
  unit: string;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Customer ID (copy from /users)',
    example: 'CUSTOMER_ID_HERE',
  })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    description: 'Store ID (copy from /stores)',
    example: 'STORE_ID_HERE',
  })
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({ description: 'Total order amount', example: 10000 })
  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @ApiPropertyOptional({
    enum: OrderStatus,
    default: OrderStatus.PENDING,
    required: false,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Shipping Address' })
  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @ApiPropertyOptional({ description: 'Shipping Phone' })
  @IsString()
  @IsOptional()
  shippingPhone?: string;

  @ApiProperty({
    description: 'List of ordered items',
    type: [OrderItemDto],
  })
  @IsArray()
  items: OrderItemDto[];
}
