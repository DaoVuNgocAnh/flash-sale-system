import { NestFactory } from '@nestjs/core';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthServiceModule);
  
  const port = process.env.AUTH_PORT ?? 3001;

  await app.listen(port);
  console.log(`Auth Service is running at port ${port}`);
}
bootstrap();