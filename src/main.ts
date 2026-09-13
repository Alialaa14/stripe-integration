import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { StripeExceptionFilter } from './stripe/stripe.exception.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1/');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new StripeExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
