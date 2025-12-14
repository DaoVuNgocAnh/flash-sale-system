import { Controller, Get, All, Req, Res, Next, Inject, Post, Body } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { ClientKafka } from '@nestjs/microservices'; // Import ClientKafka

@Controller()
export class GatewayController {
  constructor(
    private readonly gatewayService: GatewayService, // Inject Kafka Client đã đăng ký bên Module
    @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientKafka,
  ) {}

  // Hook này chạy khi Controller khởi tạo để kết nối Kafka trước
  async onModuleInit() {
    this.inventoryClient.subscribeToResponseOf('test_topic');
    await this.inventoryClient.connect();
  }

  @Get() // Mặc định là trang chủ (http://localhost:3000)
  checkHealth() {
    return this.gatewayService.getHealthCheck();
  }

  // --- API TEST KAFKA ---
  // Gọi API này -> Bắn tin nhắn vào Kafka
  @Post('test-kafka')
  testKafka(@Body() body: any) {
    const message = body.message || 'Xin chào từ Gateway!';
    
    // .emit() là gửi sự kiện một chiều (Fire and Forget) - Đúng chất Kafka
    this.inventoryClient.emit('test_topic', { 
      text: message, 
      time: new Date().toISOString() 
    });

    return { success: true, message: 'Đã gửi tin nhắn vào Kafka!' };
  }
}
