import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
  IsBoolean,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  MinLength,
  MaxLength,
  registerDecorator,
  ValidationOptions,
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

// Cross-field check: `endDate` must be strictly after whatever `startDate` was
// submitted in the SAME request. If `startDate` wasn't included in this
// request (e.g. a partial PATCH that only touches endDate), this skips the
// comparison entirely rather than failing — there's nothing to compare against.
@ValidatorConstraint({ name: 'isAfterStartDate', async: false })
class IsAfterStartDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: Date, args: ValidationArguments) {
    const object = args.object as Record<string, unknown>;
    const startDate = object[args.constraints[0]];

    if (startDate === undefined) return true;

    return (
      endDate instanceof Date &&
      !isNaN(endDate.getTime()) &&
      startDate instanceof Date &&
      !isNaN((startDate as Date).getTime()) &&
      endDate.getTime() > (startDate as Date).getTime()
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `endDate must be after ${args.constraints[0]}`;
  }
}

function IsAfterDate(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsAfterStartDateConstraint,
    });
  };
}

export class CreateHackathonDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(15)
  @MaxLength(100)
  description?: string;

  @Type(() => Date)
  @IsDate()
  @Validate(IsFutureDateConstraint)
  startDate!: Date;

  @Type(() => Date)
  @IsDate()
  @Validate(IsFutureDateConstraint)
  @IsAfterDate('startDate')
  endDate!: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
