import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'كلمة المرور الحالية مطلوبة' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'كلمة المرور الجديدة مطلوبة' })
  @MinLength(6, { message: 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'تأكيد كلمة المرور الجديدة مطلوب' })
  confirmPassword: string;
}
