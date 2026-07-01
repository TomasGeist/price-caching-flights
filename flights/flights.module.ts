import { Module } from '@nestjs/common';
import { FlightsService } from './flights.service';
import { FlightsController } from './flights.controller';
import { ProviderA } from './adapters/provider-a/provider-a';
import { ProviderB } from './adapters/provider-b/provider-b';
import { ProviderC } from './adapters/provider-c/provider-c';
import { AirlinesService } from '../common/airlines.service';
import { DateNormalizerService } from '../common/date-normalized.service';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';

@Module({
  controllers: [FlightsController],
  providers: [FlightsService, 
    ProviderA, 
    ProviderB, 
    ProviderC,
    AirlinesService,
    DateNormalizerService,
    {
      provide: 'FLIGHT_PROVIDERS',
      useFactory: (globaltrax: ProviderA, oceanic: ProviderB, latam: ProviderC) => [
        globaltrax,
        oceanic,
        latam
      ],
      inject: [ProviderA, ProviderB, ProviderC],
    },
  ],
  imports: [CacheModule.registerAsync({
  useFactory: async () => {
    return {
      ttl: 300000,
      stores: [
        new KeyvRedis('redis://redis:6379'), 
      ],
    };
  },
}),]
})
export class FlightsModule {}
