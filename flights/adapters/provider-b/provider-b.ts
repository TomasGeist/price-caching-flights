import { Injectable } from '@nestjs/common';
import { FlightProvider } from '../flight-provider-interface';
import { FlightNormalized } from '../../dto/flight-normalized.dto';
import { OceanicFlights } from '../../mocks/oceanic.mock';
import { AirlinesService } from '../../../common/airlines.service';
import { DateNormalizerService } from '../../../common/date-normalized.service';

@Injectable()
export class ProviderB implements FlightProvider {
constructor(private readonly airlinesService: AirlinesService, private readonly dateNormalizer: DateNormalizerService) {}
    

    async searchFlights(origin: string, destination: string, date?: string): Promise<FlightNormalized[]> {

    const shouldFail: boolean = true; 

    if (shouldFail) {
     throw new Error('Proveedor no disponible temporalmente');
    }

        const flights: FlightNormalized[] = OceanicFlights.filter(flight => flight.from === origin 
            && flight.to === destination 
            && (!date || flight.departure_time === date)).map(flight => ({
                code: flight.code,
                origin: flight.from,
                destination: flight.to,
                date: this.dateNormalizer.fromISO(flight.departure_time),
                hour: this.dateNormalizer.fromISOToHour(flight.departure_time),
                airline: this.airlinesService.getAirlineName(flight.airline_code),
                price: flight.fare_amount
            }));

        return Promise.resolve(flights);
    }
}