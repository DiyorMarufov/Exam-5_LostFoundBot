import { BaseEntity } from 'src/common/database/base.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ItemEntity } from './items.entity';

@Entity('item-images')
export class ItemImageEntity extends BaseEntity {
  @ManyToOne(() => ItemEntity, (item) => item.itemImages)
  @JoinColumn({ name: 'item_id', referencedColumnName: 'id' })
  item?: ItemEntity;

  @Column({ name: 'image_url', type: 'varchar',nullable:true })
  image_url?: string;
}
