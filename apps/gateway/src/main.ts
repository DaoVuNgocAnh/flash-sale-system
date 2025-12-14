import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  // 1. Lấy các công cụ cần thiết ra để dùng thủ công
  const jwtService = app.get(JwtService);
  const configService = app.get(ConfigService);

  // 2. Tạo hàm Middleware kiểm tra Token (Phiên bản thu nhỏ của AuthGuard)
  const checkAuthMiddleware = async (req, res, next) => {
    try {
      // Lấy token từ header
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) throw new Error();

      // Verify token
      const secret = configService.get<string>('ACCESS_SECRET');
      await jwtService.verifyAsync(token, { secret });

      // Nếu OK -> Cho đi tiếp (next)
      next();
    } catch (e) {
      // Nếu lỗi -> Trả về 401 ngay lập tức, không cho đi tiếp
      res.status(401).json({ message: 'Chặn cửa tại Main: Token không hợp lệ!' });
    }
  };

  // --- CẤU HÌNH PROXY ---

  // A. Proxy Auth (Không cần chặn, ai cũng vào được)
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: { '^/': '/auth/' },
    }),
  );

  // B. Proxy Products (CẦN CHẶN)
  app.use(
    '/products',
    checkAuthMiddleware, // <--- Gắn ông bảo vệ vào đây, đứng trước Proxy
    createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
      pathRewrite: { '^/': '/products/' }, // Hoặc không cần nếu bên kia là @Controller()
      on: {
        proxyReq: (proxyReq, req, res) => {
          console.log(`[Proxy] Gọi vào Products: ${req.url}`);
        },
      },
    }),
  );

  const port = process.env.GATEWAY_PORT ?? 3000;
  await app.listen(port);
  console.log(`Gateway is running at port ${port}`);
}
bootstrap();