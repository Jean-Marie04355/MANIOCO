import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocationService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Calcule la distance entre deux points (Haversine)
   */
  getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calcule les frais de livraison
   */
  calculateDeliveryFee(distanceKm: number): number {
    const baseFee = Number(this.configService.get('DELIVERY_BASE_FEE')) || 500;
    const perKmFee = Number(this.configService.get('DELIVERY_PER_KM_FEE')) || 100;
    return Math.round(baseFee + (distanceKm * perKmFee));
  }
}
