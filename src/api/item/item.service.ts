import { Injectable } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemService {
  create(createItemDto: CreateItemDto) {
    return 'This action adds a new item';
  }
}
