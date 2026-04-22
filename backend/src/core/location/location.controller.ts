import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LocationService } from './location.service';

@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('distance')
  @ApiOperation({ summary: 'Calculate distance between two GPS points' })
  getDistance(
    @Query('lat1') lat1: number,
    @Query('lon1') lon1: number,
    @Query('lat2') lat2: number,
    @Query('lon2') lon2: number,
  ) {
    const distance = this.locationService.getDistance(
      Number(lat1),
      Number(lon1),
      Number(lat2),
      Number(lon2),
    );
    return { distance: Math.round(distance * 100) / 100, unit: 'km' };
  }

  @Get('delivery-fee')
  @ApiOperation({ summary: 'Calculate delivery fee based on distance' })
  getDeliveryFee(@Query('distance') distance: number) {
    const fee = this.locationService.calculateDeliveryFee(Number(distance));
    return { fee, currency: 'FCFA' };
  }
}
