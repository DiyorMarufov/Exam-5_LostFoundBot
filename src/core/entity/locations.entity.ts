import { BaseEntity } from 'src/common/database/base.entity';
import { LocationDistrict, LocationRegion } from 'src/common/enum';
import { Entity, Column, OneToMany } from 'typeorm';
import { ItemEntity } from './items.entity';

@Entity('locations')
export class LocationEntity extends BaseEntity {
  @Column({ name: 'region', enum: LocationRegion })
  region: LocationRegion;

  @Column({ name: 'district', enum: LocationDistrict })
  district: LocationDistrict;

  @Column({
    name: 'latitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitude: number;

  @Column({
    name: 'longitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitude: number;

  @Column({ name: 'description', type: 'varchar' })
  description: string;

  @OneToMany(() => ItemEntity, (item) => item.location)
  items: ItemEntity[];
}
