import { Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { LocationRepo } from 'src/core/repository/location.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { LocationEntity } from 'src/core/entity/locations.entity';
import { errorCatch } from 'src/infrastructure/lib/exception/error.catch';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(LocationEntity)
    private readonly locationRepo: LocationRepo,
  ) {}
  async create(
    createLocationDto: CreateLocationDto,
  ): Promise<object | undefined> {
    try {
      const newLocationObj = this.locationRepo.create(createLocationDto);
      const saved = await this.locationRepo.save(newLocationObj);
      return saved;
    } catch (e) {
      return errorCatch(e);
    }
  }

  async updateLocation(
    itemId: string,
    updateDto: object,
  ): Promise<object | undefined | boolean> {
    try {
      const { affected } = await this.locationRepo.update(itemId, updateDto);

      if (!affected) {
        return false;
      }
      return true;
    } catch (e) {
      return errorCatch(e);
    }
  }
}
