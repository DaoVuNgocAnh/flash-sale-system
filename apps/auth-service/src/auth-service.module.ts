import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { CommonModule } from '@app/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // Cấu hình ConfigModule (quan trọng)
    ConfigModule.forRoot({
      isGlobal: true, // Để dùng được ở mọi nơi (Service, Controller...)
      envFilePath: '.env', // Chỉ định file env
    }),
    CommonModule,
    // Chỉ cần đăng ký rỗng để dùng được JwtService inside AuthService
    JwtModule.register({}), 
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}