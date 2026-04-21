import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UsersService } from './src/core/users/users.service';

async function deleteAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  
  const userToDelete = await usersService.findByEmail('admin@gmail.com');
  if (userToDelete) {
    await usersService.remove(userToDelete.id);
    console.log('SUCCESS: admin@gmail.com deleted');
  } else {
    console.log('INFO: admin@gmail.com not found');
  }
  
  await app.close();
}

deleteAdmin();
