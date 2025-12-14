import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';

import { AuthGuard } from './auth.guard';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs'; 

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. Đăng ký module JWT để Guard có công cụ soi Token
    JwtModule.register({}),
    
    // --- ĐĂNG KÝ KAFKA CLIENT ---
    ClientsModule.register([
      {
        name: 'INVENTORY_SERVICE', // Tên để gọi trong Controller (Injection Token)
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'gateway',
            brokers: [process.env.KAFKA_BROKERS ?? 'localhost:9092'],
          },
          consumer: {
            groupId: 'gateway-consumer',
          },
          producer: {
            createPartitioner: Partitioners.LegacyPartitioner,
          },
        },
      },
    ]),
  ],
  controllers: [GatewayController], // Giữ nguyên để test server sống/chết
  providers: [
    GatewayService, // Giữ nguyên

    // 3. Kích hoạt AuthGuard cho TOÀN BỘ Gateway
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class GatewayModule {}
