import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsIn,
} from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsIn(['CASH', 'VISA', 'INSTAPAY', 'VODAFONE_CASH'])
  method: string;
}

