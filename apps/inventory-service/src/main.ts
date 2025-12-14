import { NestFactory } from '@nestjs/core';
import { InventoryServiceModule } from './inventory-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';

async function bootstrap() {
  // --- THÊM ĐOẠN NÀY ---
  console.log("========================================");
  console.log("DEBUG: KAFKA_BROKERS =", process.env.KAFKA_BROKERS);
  console.log("DEBUG: USING BROKER =", process.env.KAFKA_BROKERS ?? 'localhost:9092');
  console.log("========================================");
  // ---------------------
  const app = await NestFactory.create(InventoryServiceModule);
  
  // 1. Kết nối thêm Kafka (Microservice)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKERS ?? 'localhost:9092'], // Kết nối đến Kafka Docker đang chạy
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