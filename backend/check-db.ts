import { createConnection } from 'typeorm';
import { Store } from './src/core/store/store.entity';
import { Message } from './src/core/chat/entities/chat.entity';

async function checkDb() {
  const connection = await createConnection({
    type: 'sqlite',
    database: 'database.sqlite',
    entities: [Store, Message],
    synchronize: false,
  });

  const stores = await connection.getRepository(Store).find();
  console.log('--- STORES ---');
  stores.forEach(s => {
    console.log(`Store: ${s.name} | Photo: ${s.profilePhoto}`);
  });

  const lastMessages = await connection.getRepository(Message).find({
    order: { createdAt: 'DESC' },
    take: 5
  });
  console.log('\n--- LAST MESSAGES ---');
  lastMessages.forEach(m => {
    console.log(`Msg: ${m.text || 'Image'} | Image field: ${m.image ? m.image.substring(0, 50) + '...' : 'null'}`);
  });

  await connection.close();
}

checkDb().catch(console.error);
