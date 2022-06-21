import { CacheModule, Logger, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-ioredis';
import { TelegramService } from './telegram.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => ({
        db: String(process.env.REDIS_DB),
        host: String(process.env.REDIS_HOST),
        port: Number(process.env.REDIS_PORT),
        store: redisStore,
      }),
    }),
  ],
  exports: [CacheModule],
  controllers: [],
  providers: [TelegramService, Logger],
})
export class TelegramModule {}
