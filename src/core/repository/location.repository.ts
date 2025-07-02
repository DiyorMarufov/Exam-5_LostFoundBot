import { Repository } from 'typeorm';
import { LocationEntity } from '../entity/locations.entity';

export type LocationRepo = Repository<LocationEntity>;
