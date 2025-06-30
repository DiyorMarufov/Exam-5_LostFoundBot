import { BaseEntity } from 'src/common/database/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { ItemEntity } from './items.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ name: 'telegram_id', type: 'bigint' })
  telegram_id: number;

  @Column({ name: 'username', type: 'varchar', unique: true })
  username: string;

  @Column({ name: 'phone_number', type: 'varchar', unique: true })
  phone_number: string;

  @Column({ name: 'full_name', type: 'varchar' })
  full_name: string;

  @OneToMany(() => ItemEntity, (item) => item.user)
  items: ItemEntity[];
}
