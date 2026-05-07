import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import basicAuth from 'express-basic-auth';
import { ConfigService } from '@nestjs/config';
import { AdminSeeder } from './common/seeder/admin.seeder';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security and Body Parsing
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.useGlobalPipes(new ValidationPipe());

  // Get ConfigService for configuration
  const configService = app.get(ConfigService);

  // Enable Global CORS
  app.enableCors();

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Afrigari API')
    .setDescription(
      'API to manage clients, sellers, delivery personnel, and products',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Basic auth for Swagger routes
  const swaggerUser = configService.getOrThrow<string>('SWAGGER_USERNAME');
  const swaggerPassword = configService.getOrThrow<string>('SWAGGER_PASSWORD');

  app.use(
    ['/api', '/api-json'],
    basicAuth({
      challenge: true,
      users: {
        [swaggerUser]: swaggerPassword,
      },
    }),
  );

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Auto-seed admin account on startup
  const adminSeeder = app.get(AdminSeeder);
  await adminSeeder.seed();

  await app.listen(configService.get<number>('PORT', 3000));
}
bootstrap();
