import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsInt()
  @IsNotEmpty()
  telegram_id: number;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  full_name: string;
}
