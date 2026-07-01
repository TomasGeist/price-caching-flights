import { Injectable } from '@nestjs/common';
import { FlightProvider } from '../flight-provider-interface';
import { FlightNormalized } from '../../dto/flight-normalized.dto';
import { SkyHighFlights } from '../../mocks/sky-high.mock';
import { DateNormalizerService } from '../../../common/date-normalized.service';

@Injectable()
export class ProviderC implements FlightProvider {
    constructor(private readonly dateNormalizer: DateNormalizerService) {}

    async searchFlights(origin: string, destination: string, date?: string): Promise<FlightNormalized[]> {
        const flights: FlightNormalized[] = SkyHighFlights.filter(flight => flight.origin === origin 
            && flight.destination === destination 
            && (!date || this.dateNormalizer.fromISO(flight.dep) === date)).map(flight => ({
                code: flight.id,
                origin: flight.origin,
                destination: flight.destination,
                date: this.dateNormalizer.fromISO(flight.dep),
                hour: this.dateNormalizer.fromISOToHour(flight.dep),
                airline: flight.airline,
                price: flight.price
            }));

        return Promise.resolve(flights);
    }
}