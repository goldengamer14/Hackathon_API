import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,           // required for @Type(() => Date) to actually convert JSON strings into Date instances before validation
      whitelist: true,           // strips any fields not declared on the DTO
      forbidNonWhitelisted: true, // 400s on unexpected fields instead of silently dropping them
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
