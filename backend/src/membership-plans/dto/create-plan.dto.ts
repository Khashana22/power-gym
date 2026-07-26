import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsInt()
  @Min(1)
  durationDays: number;

  @IsNumber()
  @Min(0)
  price: number;
}