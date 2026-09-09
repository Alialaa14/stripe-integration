import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { StripeExceptionFilter } from './stripe/stripe.exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
  app.setGlobalPrefix('/api/v1');
  app.useGlobalFilters(new StripeExceptionFilter());
}
bootstrap();
