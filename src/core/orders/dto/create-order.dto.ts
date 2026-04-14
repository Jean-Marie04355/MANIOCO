import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
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

  @ApiProperty({
    description: 'List of ordered items',
    type: [OrderItemDto],
  })
  @IsArray()
  items: OrderItemDto[];
}
