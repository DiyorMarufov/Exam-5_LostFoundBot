import { Repository } from 'typeorm';
import { UserEntity } from '../entity/users.entity';

export type UserRepo = Repository<UserEntity>;
