import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { UserModule } from '../user/user.module';
import { LocationModule } from '../location/location.module';
import { ItemModule } from '../item/item.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemImageEntity } from 'src/core/entity/items.images.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemImageEntity]),
    UserModule,
    LocationModule,
    ItemModule,
  ],
  providers: [BotService, BotUpdate],
})
export class BotModule {}
