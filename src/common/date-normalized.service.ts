import { Injectable } from '@nestjs/common';
import { parse, parseISO, format, isValid } from 'date-fns';

@Injectable()
export class DateNormalizerService {
  
  fromISO(isoString: string): string {
    const date = parseISO(isoString);
    if (!isValid(date)) throw new Error('Invalid ISO date');
    return format(date, 'yyyy-MM-dd');
  }

  fromFormat(dateString: string, formatPattern: string): string {
    const date = parse(dateString, formatPattern, new Date());
    if (!isValid(date)) throw new Error(`Invalid date format for: ${dateString}`);
    return format(date, 'yyyy-MM-dd');
  }

  fromISOToHour(isoString: string): string {
    const date = parseISO(isoString);
    if (!isValid(date)) throw new Error('Invalid ISO date');
    return format(date, 'HH:mm:ss');
  }

  fromFormatToHour(dateString: string, formatPattern: string): string {
    const date = parse(dateString, formatPattern, new Date());
    if (!isValid(date)) throw new Error(`Invalid date format for: ${dateString}`);
    return format(date, 'HH:mm:ss');
  }
}