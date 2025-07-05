import { ItemStatus, ItemType } from 'src/common/enum';
import { LocationEntity } from 'src/core/entity/locations.entity';
import { UserEntity } from 'src/core/entity/users.entity';

export class CreateItemDto {
  user: UserEntity;
  type: ItemType;
  title: string;
  description: string;
  location: LocationEntity;
  date_found_lost: string;
  time_found_lost: string;
  is_resolved?: boolean;
  status?: ItemStatus;
}
