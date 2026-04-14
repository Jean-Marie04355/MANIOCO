import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Activation nécessaire pour les tests locaux

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
