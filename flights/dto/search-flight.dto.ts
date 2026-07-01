import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsOptional } from 'class-validator';

export class SearchFlightDto {
  @ApiProperty({ description: 'Código IATA de origen', example: 'EZE' })
  @IsString()
  @Length(3, 3)
  origin: string;

  @ApiProperty({ description: 'Código IATA de destino', example: 'MAD' })
  @IsString()
  @Length(3, 3)
  destination: string;

  @ApiProperty({ description: 'Fecha del vuelo en formato ISO', example: '2026-07-01' })
  @IsString()
  @IsOptional() 
  date?: string;
}