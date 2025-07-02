import { ItemStatus, ItemType } from 'src/common/enum';

export class CreateItemDto {
  user: string;
  type: ItemType;
  title: string;
  description: string;
  location: string;
  date_found_lost: string;
  time_found_lost: string;
  is_resolved?: boolean;
  status?: ItemStatus;
}
