import { getDistance } from './location.helper';

describe('locationHelper', () => {
  it('should calculate distance between two points correctly', () => {
    // Distance between Paris and London is approx 344km
    const paris = { lat: 48.8566, lon: 2.3522 };
    const london = { lat: 51.5074, lon: -0.1278 };
    const distance = getDistance(paris.lat, paris.lon, london.lat, london.lon);
    expect(distance).toBeGreaterThan(340);
    expect(distance).toBeLessThan(350);
  });

  it('should return 0 for same point', () => {
    const result = getDistance(10, 10, 10, 10);
    expect(result).toBe(0);
  });
});
