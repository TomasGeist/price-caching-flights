import { Controller, Get, Query } from '@nestjs/common';
import { FlightsService } from './flights.service';
import { SearchFlightDto } from './dto/search-flight.dto';

@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

    @Get() 

    async search(@Query() query: SearchFlightDto): Promise<any> 
      {
        return await this.flightsService.searchAll(query.origin, query.destination, query.date);
      }

  }
