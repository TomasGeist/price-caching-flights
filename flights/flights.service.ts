import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { FlightProvider } from './adapters/flight-provider-interface';
import { FlightNormalized } from './dto/flight-normalized.dto';
import { Cache } from '@nestjs/cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class FlightsService {
  private readonly logger = new Logger(FlightsService.name);
    constructor(
    @Inject('FLIGHT_PROVIDERS') private providers: FlightProvider[],
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async searchAll(origin: string, destination: string, date?: string): Promise<any> {
    const cacheKey = `${origin}-${destination}-${date}`;
    let cachedResult;
    
    try {
      cachedResult = await this.cacheManager.get(cacheKey);
    } catch (error: any) {
      this.logger.error(`Error retrieving cached result for ${cacheKey}: ${error.message}`);
    }


    if (cachedResult) {
      this.logger.log(`Returning cached result for ${cacheKey}`);
      return cachedResult;
    }

    const results = await Promise.allSettled(
      this.providers.map((provider) => provider.searchFlights(origin, destination, date))
    );


    const successfulResults: FlightNormalized[] = [];

    results.forEach((result, index) =>  {
      if (result.status === 'fulfilled') {
        successfulResults.push(...result.value);
      }else {
        this.logger.error(
          `The provider ${this.providers[index].constructor.name} failed. ` +
          `Reason: ${result.reason.message}`
        );
      }
    });


    if (successfulResults.length === 0) {
       throw new InternalServerErrorException('Flight providers returned results.');
    }

    try {
        await this.cacheManager.set(cacheKey, successfulResults, 300000);
    } catch (e: any) {
        this.logger.error(`Failed to write to Redis: ${e.message}`);
    }

   
    return successfulResults;
  }
}
