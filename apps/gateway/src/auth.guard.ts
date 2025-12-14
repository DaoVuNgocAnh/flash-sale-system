import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // 1. Lấy đường dẫn request
    const path = request.path;

    // 2. Bỏ qua (cho phép) các route Auth (Login/Register/Refresh)
    // Nếu request bắt đầu bằng /auth/... thì cho qua luôn, không cần check token
    if (path.startsWith('/auth') || path === '/') {
      return true;
    }

    // 3. Lấy Token từ Header (Authorization: Bearer <token>)
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Not logged in (Missing Token)');
    }

    try {
      // 4. Xác thực Token (Soi vé)
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('ACCESS_SECRET'),
      });
      
      // 5. Gán thông tin user vào request để các service sau dùng nếu cần
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}