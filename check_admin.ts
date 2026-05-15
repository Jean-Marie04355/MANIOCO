
import { createConnection } from 'typeorm';
import { User } from './backend/src/core/users/user.entity';

async function checkAdmin() {
  try {
    const connection = await createConnection({
      type: 'sqlite',
      database: './backend/database.sqlite',
      entities: [User],
      synchronize: false,
    });

    const userRepository = connection.getRepository(User);
    const admin = await userRepository.findOne({ where: { email: 'admin@gmail.com' } });

    if (admin) {
      console.log('Admin found:');
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Hashed Password:', admin.password);
    } else {
      console.log('Admin NOT found in database.');
      const allUsers = await userRepository.find();
      console.log('Total users:', allUsers.length);
      allUsers.forEach(u => console.log(`- ${u.email} (${u.role})`));
    }

    await connection.close();
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkAdmin();
