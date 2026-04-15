import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AdminSeeder } from './common/seeder/admin.seeder';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security middlewares
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe());
  
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Execute Seeders
  const seeder = app.get(AdminSeeder);
  await seeder.seed();
  
  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Afrigari API')
    .setDescription(
      'API to manage clients, sellers, delivery personnel, and products',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // accessible via /api

  await app.listen(3000);
}
void bootstrap();
