import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = config.API_PORT;
  await app.listen(PORT, () => console.log(`Server is running on port`, PORT));
}
bootstrap();
