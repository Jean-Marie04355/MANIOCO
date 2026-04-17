import { CreateProductDto } from './create-product.dto';
import { UpdateProductDto } from './update-product.dto';
import { Product } from '../product.entity';

describe('Products passive files', () => {
  it('should instantiate DTOs', () => {
    expect(new CreateProductDto()).toBeDefined();
    expect(new UpdateProductDto()).toBeDefined();
  });

  it('should instantiate Product entity', () => {
    expect(new Product()).toBeDefined();
  });
});
