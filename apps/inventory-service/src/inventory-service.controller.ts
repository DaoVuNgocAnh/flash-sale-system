import { Controller, Get } from '@nestjs/common';
import { InventoryServiceService } from './inventory-service.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('products')
export class InventoryServiceController {
  constructor(private readonly inventoryServiceService: InventoryServiceService) {}

  @Get()
  getHello(): string {
    return this.inventoryServiceService.getHello();
  }

  // --- LẮNG NGHE KAFKA Ở ĐÂY ---
  @EventPattern('test_topic') // Tên Topic muốn nghe
  handleTestEvent(@Payload() data: any) {
    console.log('⚡ [Inventory] Đã nhận được tin nhắn từ Kafka:', data);
    // Logic xử lý trừ kho sẽ viết ở đây vào các tuần sau
  }
}
