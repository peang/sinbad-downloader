import { NestFactory } from '@nestjs/core';
import * as env from 'dotenv';
import { AppModule } from './app.module';

async function bootstrap() {
  env.config();
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
