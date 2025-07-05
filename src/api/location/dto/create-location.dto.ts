import { LocationDistrict, LocationRegion } from 'src/common/enum';

export class CreateLocationDto {
  region?: LocationRegion;
  district?: LocationDistrict;
  latitude?: number;
  longitude?: number;
  description: string;
}
