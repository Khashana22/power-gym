import { IsString, IsNotEmpty } from 'class-validator';

export class CheckinDto {
  @IsString()
  @IsNotEmpty()
  memberCode: string;
}
