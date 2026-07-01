import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AirlinesService implements OnModuleInit {
  private readonly logger = new Logger(AirlinesService.name);
  private airlinesMap: Map<string, string> = new Map();

  async onModuleInit() {
    
    await this.loadAirlines();
  }

  private async loadAirlines() {
    try {
      const url = 'https://cdn.jsdelivr.net/gh/besrourms/airlines@latest/airlines.json';
      const { data } = await axios.get(url);
      
      data.forEach((item: { code: string; name: string }) => {
        this.airlinesMap.set(item.code.toUpperCase(), item.name);
      });
      
      this.logger.log(`AirlinesService has initialized with ${this.airlinesMap.size} airlines.`);
    } catch (error) {
      this.logger.error('Is not posible to load the airlines list', error);
    }
  }

  getAirlineName(code: string): string {
    return this.airlinesMap.get(code.toUpperCase()) || 'Unknown Airline';
  }
}