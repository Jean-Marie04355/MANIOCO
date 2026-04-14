import { performCalculation } from './calculation';

describe('Calculation', () => {
  it('should add when > 100', () => {
    expect(performCalculation(101, 5)).toBe(106);
  });

  it('should multiply when <= 100', () => {
    expect(performCalculation(50, 5)).toBe(250);
  });
});
