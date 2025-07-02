import { Repository } from 'typeorm';
import { ItemEntity } from '../entity/items.entity';

export type ItemRepo = Repository<ItemEntity>;
