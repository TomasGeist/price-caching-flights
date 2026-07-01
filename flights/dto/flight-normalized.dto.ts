import { IsString, Length } from 'class-validator';

export class FlightNormalized {
  @IsString()
  @Length(1, 10)
  code: string;

  @IsString()
  @Length(1, 3)
  origin: string;

  @IsString()
  @Length(1, 3)
  destination: string;

  @IsString()
  date: string;

  @IsString()
  hour: string;

  @IsString()
  airline: string;

  @IsString()
  price: number;
}