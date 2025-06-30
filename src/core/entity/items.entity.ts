import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { UserEntity } from './users.entity';
import { ItemStatus, ItemType } from 'src/common/enum';
import { LocationEntity } from './locations.entity';
import { ItemImageEntity } from './items.images.entity';
import { BaseEntity } from 'src/common/database/base.entity';

@Entity('items')
export class ItemEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (user) => user.items)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: string;

  @Column({ name: 'type', enum: ItemType })
  type: ItemType;

  @Column({ name: 'title', type: 'varchar' })
  title: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @ManyToOne(() => LocationEntity, (location) => location.items)
  @JoinColumn({ name: 'location_id', referencedColumnName: 'id' })
  location: string;

  @Column({ name: 'date_found_lost', type: 'date' })
  date_found_lost: Date;

  @Column({ name: 'time_found_lost', type: 'varchar' })
  time_found_lost: string;

  @Column({ name: 'contact_info', type: 'varchar' })
  contact_info: string;

  @Column({ name: 'is_resolved', type: 'boolean' })
  is_resolved: boolean;

  @Column({ name: 'status', enum: ItemStatus })
  status: ItemStatus;

  @OneToMany(() => ItemImageEntity, (itemImage) => itemImage.item)
  itemImages: ItemImageEntity[];
}
