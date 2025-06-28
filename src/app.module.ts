import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { config } from './config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './api/user/user.module';
import { BotModule } from './api/bot/bot.module';
import { session } from 'telegraf/session';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: config.DB_URL,
      synchronize: true,
      logging: false,
      autoLoadEntities: true,
      entities: [__dirname + '/**/*.entity.{ts,js}'],
    }),
    TelegrafModule.forRoot({
      token: config.BOT_TOKEN,
      middlewares: [session()],
    }),
    BotModule,
    UserModule,
  ],
})
export class AppModule {}
