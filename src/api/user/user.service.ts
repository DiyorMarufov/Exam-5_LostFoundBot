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
      return newUser
    } catch (e) {
      return errorCatch(e);
    }
  }

  async findUserByTelegramId(
    telegram_id: number,
  ): Promise<object | boolean | undefined> {
    try {
      const user = await this.userRepo.findOne({
        where: { telegram_id },
      });

      if (user) {
        return user;
      }
      return false;
    } catch (e) {
      return errorCatch(e);
    }
  }
}
