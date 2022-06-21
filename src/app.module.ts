import { Module } from '@nestjs/common';
import { TelegramModule } from './telegram.module';

@Module({
  imports: [TelegramModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
