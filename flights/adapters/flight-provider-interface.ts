import { FlightNormalized } from '../dto/flight-normalized.dto';

export interface FlightProvider {
  searchFlights(origin: string, destination: string, date?: string): Promise<FlightNormalized[]>;
}