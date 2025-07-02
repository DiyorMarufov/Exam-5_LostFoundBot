import { Injectable } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ItemEntity } from 'src/core/entity/items.entity';
import { ItemRepo } from 'src/core/repository/item.repository';
import { errorCatch } from 'src/infrastructure/lib/exception/error.catch';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(ItemEntity) private readonly itemRepo: ItemRepo,
  ) {}
  async create(createItemDto: CreateItemDto): Promise<object | undefined> {
    try {
      const newItemObj = this.itemRepo.create(createItemDto);
      const saved = await this.itemRepo.save(newItemObj);
      return saved;
    } catch (error) {
      return errorCatch(error);
    }
  }
}
