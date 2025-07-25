import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationEntity } from 'src/core/entity/locations.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LocationEntity])],
  providers: [LocationService],
  exports:[LocationService]
})
export class LocationModule {}
