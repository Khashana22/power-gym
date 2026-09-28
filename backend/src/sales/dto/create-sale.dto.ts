import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateSaleDto {
  @IsString()
  @IsNotEmpty({ message: 'اسم الصنف أو المشروب مطلوب' })
  itemName: string;

  @IsNumber({}, { message: 'السعر يجب أن يكون رقماً' })
  @IsPositive({ message: 'السعر يجب أن يكون أكبر من الصفر' })
  amount: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
