import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from '@shared/infrastructure/filters/global-exception.filter';
import { setupSwagger } from '@shared/infrastructure/swagger/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService.get<string>('app.corsOrigin'),
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
