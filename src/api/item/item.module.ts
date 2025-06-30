import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemEntity } from 'src/core/entity/items.entity';
import { ItemImageEntity } from 'src/core/entity/items.images.entity';
import { LocationEntity } from 'src/core/entity/locations.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemEntity, ItemImageEntity, LocationEntity]),
  ],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemModule {}
