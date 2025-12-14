import { NestFactory } from '@nestjs/core';
import { InventoryServiceModule } from './inventory-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';

async function bootstrap() {
  const app = await NestFactory.create(InventoryServiceModule);
  
  // 1. Kết nối thêm Kafka (Microservice)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['localhost:9092'], // Kết nối đến Kafka Docker đang chạy
      },
      consumer: {
        groupId: 'inventory-consumer', // Định danh nhóm xử lý (quan trọng)
      },
      producer: {
        createPartitioner: Partitioners.LegacyPartitioner,
      },
    },
  });

  // 2. Khởi động Microservice
  await app.startAllMicroservices();

  const port = process.env.INVENTORY_PORT ?? 3002;
  await app.listen(port);
  console.log(`Inventory Service đang lắng nghe HTTP: ${port} và Kafka`);
}
bootstrap();