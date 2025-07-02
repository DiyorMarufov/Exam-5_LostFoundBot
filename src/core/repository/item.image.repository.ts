import { Repository } from 'typeorm';
import { ItemImageEntity } from '../entity/items.images.entity';

export type ItemImageRepo = Repository<ItemImageEntity>;
