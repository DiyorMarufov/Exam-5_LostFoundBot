import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { UserEntity } from './users.entity';
import { ItemStatus, ItemType } from 'src/common/enum';
import { LocationEntity } from './locations.entity';
import { ItemImageEntity } from './items.images.entity';
import { BaseEntity } from 'src/common/database/base.entity';

@Entity('items')
export class ItemEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (user) => user.items, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @Column({ name: 'type', enum: ItemType })
  type: ItemType;

  @Column({ name: 'title', type: 'varchar' })
  title: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @ManyToOne(() => LocationEntity, (location) => location.items, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'location_id', referencedColumnName: 'id' })
  location: LocationEntity;

  @Column({ name: 'date_found_lost', type: 'date' })
  date_found_lost: Date;

  @Column({ name: 'time_found_lost', type: 'varchar' })
  time_found_lost: string;

  @Column({ name: 'is_resolved', type: 'boolean', default: false })
  is_resolved: boolean = false;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ItemStatus,
    default: ItemStatus.PENDING,
  })
  status: ItemStatus;

  @OneToMany(() => ItemImageEntity, (itemImage) => itemImage.item)
  itemImages: ItemImageEntity[];
}
