import { CreateUserDto } from './create-user.dto';
import { User } from '../user.entity';

describe('Users passive files', () => {
  it('should instantiate CreateUserDto', () => {
    const dto = new CreateUserDto();
    expect(dto).toBeDefined();
  });

  it('should instantiate User entity', () => {
    const entity = new User();
    expect(entity).toBeDefined();
  });
});
