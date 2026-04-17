import { Test, TestingModule } from '@nestjs/testing';
import { AdminSeeder } from './admin.seeder';
import { UsersService } from '../../core/users/users.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../enum/role.enum';

describe('AdminSeeder', () => {
  let seeder: AdminSeeder;
  let usersServiceMock: any;
  let configServiceMock: any;

  beforeEach(async () => {
    usersServiceMock = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    configServiceMock = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSeeder,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    seeder = module.get<AdminSeeder>(AdminSeeder);
  });

  it('should seed if admin not exists', async () => {
    configServiceMock.get.mockImplementation((key) => {
      if (key === 'ADMIN_EMAIL') return 'admin@test.com';
      if (key === 'ADMIN_PASSWORD') return 'pass';
    });
    usersServiceMock.findByEmail.mockResolvedValue(null);

    await seeder.seed();
    expect(usersServiceMock.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'admin@test.com',
      role: UserRole.SUPER_ADMIN,
    }));
  });

  it('should skip if credentials missing', async () => {
    configServiceMock.get.mockReturnValue(null);
    await seeder.seed();
    expect(usersServiceMock.findByEmail).not.toHaveBeenCalled();
  });

  it('should skip if admin already exists', async () => {
    configServiceMock.get.mockReturnValue('admin@test.com');
    usersServiceMock.findByEmail.mockResolvedValue({ id: '1' });
    await seeder.seed();
    expect(usersServiceMock.create).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    configServiceMock.get.mockReturnValue('admin@test.com');
    usersServiceMock.findByEmail.mockRejectedValue(new Error('Seed Error'));
    await seeder.seed(); // Should not throw
    expect(usersServiceMock.findByEmail).toHaveBeenCalled();
  });
});
