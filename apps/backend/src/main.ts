import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kích hoạt CORS cho Frontend Web & Tablet
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Validation Pipe với class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Thiết lập tiền tố API toàn cục
  app.setGlobalPrefix('api/v1');

  // Cấu hình Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('KidsNutriJournal API')
    .setDescription('Hệ thống Quản lý Dinh dưỡng và Bữa ăn Bán trú tại Trường Mầm non (Multi-tenant RESTful API)')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-tenant-id', in: 'header' }, 'TenantHeader')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[KidsNutriJournal] Backend Server đang chạy tại: http://localhost:${port}/api/v1`);
  console.log(`[KidsNutriJournal] Swagger API Docs: http://localhost:${port}/api/docs`);
}

bootstrap();
// Trigger reload
