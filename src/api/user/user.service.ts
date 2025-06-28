import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/core/entity/users.entity';
import { UserRepo } from 'src/core/repository/user.repository';
import { errorCatch } from 'src/infrastructure/lib/exception/error.catch';
import { CreateUserDto } from './dto/create.user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: UserRepo,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<object | undefined> {
    try {
      const newUser = this.userRepo.create(createUserDto);
      await this.userRepo.save(newUser);
    } catch (e) {
      return errorCatch(e);
    }
  }
}
