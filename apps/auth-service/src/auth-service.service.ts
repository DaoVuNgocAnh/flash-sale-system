import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@app/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthServiceService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // 1. Đăng ký
  async register(data: any) {
    const exists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (exists) throw new BadRequestException('Email đã tồn tại');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        // Lưu ý: ID bây giờ là String (UUID) nên không cần lo về kiểu Int nữa
      },
    });

    // Đăng ký xong cấp luôn token để user tự đăng nhập
    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  // 2. Đăng nhập
  async login(data: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) throw new UnauthorizedException('Sai email hoặc mật khẩu');

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Sai email hoặc mật khẩu');

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  // 3. Đăng xuất
  async logout(userId: string) {
    // Cách fix lỗi TS ở đây: update Many hoặc check null,
    // nhưng prisma.user.update yêu cầu where unique ID nên rất chuẩn.
    // Lỗi của bạn trước đó do Prisma Client chưa cập nhật thôi.
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
    return { message: 'Đăng xuất thành công' };
  }

  // 4. Làm mới Token (Refresh)
  async refreshTokens(userId: string, rt: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedRefreshToken)
      throw new ForbiddenException('Access Denied');

    const rtMatches = await bcrypt.compare(rt, user.hashedRefreshToken);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  // --- Helper Functions ---

  async updateRefreshToken(userId: string, rt: string) {
    const hash = await bcrypt.hash(rt, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hash },
    });
  }

  async getTokens(userId: string, email: string, role: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get<string>('ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get<string>('REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
