import { Controller, Post, Body } from '@nestjs/common';
import { AuthServiceService } from './auth-service.service';

@Controller('auth') // Đường dẫn sẽ là /auth
export class AuthServiceController {
  constructor(private readonly authService: AuthServiceService) {}

  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Post('refresh')
  refresh(@Body() body: { userId: string; refreshToken: string }) {
    return this.authService.refreshTokens(body.userId, body.refreshToken);
  }

  @Post('logout')
  logout(@Body() body: { userId: string }) {
    return this.authService.logout(body.userId);
  }
}