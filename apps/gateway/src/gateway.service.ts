import { Injectable } from '@nestjs/common';

@Injectable()
export class GatewayService {
  getHealthCheck(): string {
    return 'Gateway is running! 🚀 (Time: ' + new Date().toISOString() + ')';
  }
}