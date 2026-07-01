import { Injectable } from '@nestjs/common';
import { FlightProvider } from '../flight-provider-interface';
import { FlightNormalized } from '../../dto/flight-normalized.dto';
import { GlobalTraxFlights } from '../../mocks/global-trax.mock';
import { DateNormalizerService } from '../../../common/date-normalized.service';

@Injectable()
export class ProviderA implements FlightProvider {
    constructor(private readonly dateNormalizer: DateNormalizerService) {}

    async searchFlights(origin: string, destination: string, date?: string): Promise<FlightNormalized[]> {
        const flights: FlightNormalized[] = 
        GlobalTraxFlights.filter(flight => flight.route.origin === origin 
            && flight.route.destination === destination 
            && (!date || flight.departure === date)).map(flight => ({
                code: flight.flight_details.ref,
                origin: flight.route.origin,
                destination: flight.route.destination,
                date: this.dateNormalizer.fromISO(flight.departure),
                hour: this.dateNormalizer.fromISOToHour(flight.departure),
                airline: flight.operator.name,
                price: flight.flight_details.cost
            }));
        return Promise.resolve(flights);
    }
}