import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() gymName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() logo?: string;
  @IsOptional() @IsString() primaryColor?: string;
  @IsOptional() @IsString() secondaryColor?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() businessHours?: string;
  @IsOptional() @IsString() whatsappToken?: string;
  @IsOptional() @IsString() whatsappPhoneId?: string;
  @IsOptional() @IsBoolean() whatsappEnabled?: boolean;
  @IsOptional() @IsString() smtpHost?: string;
  @IsOptional() @IsNumber() smtpPort?: number;
  @IsOptional() @IsString() smtpUser?: string;
  @IsOptional() @IsString() smtpPassword?: string;
  @IsOptional() @IsString() smtpFrom?: string;
  @IsOptional() @IsBoolean() smtpEnabled?: boolean;
  @IsOptional() @IsString() paymentMethods?: string;
}
