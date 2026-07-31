import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  IsDate,
  IsBoolean,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  MinLength,
  MaxLength,
} from 'class-validator';

@ValidatorConstraint({ name: 'isFutureDate', async: false })
class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: Date, _args: ValidationArguments) {
    return value instanceof Date && !isNaN(value.getTime()) && value.getTime() > Date.now();
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a date in the future`;
  }
}

export class CreateHackathonDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(15)
  @MaxLength(100)
  // @Length(10, 1000)
  description?: string;

  @Type(() => Date)
  @IsDate()
  @Validate(IsFutureDateConstraint)
  startDate!: Date;

  @Type(() => Date)
  @IsDate()
  @Validate(IsFutureDateConstraint)
  endDate!: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
