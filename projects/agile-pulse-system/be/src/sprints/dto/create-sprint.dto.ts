import {
  IsString,
  IsNotEmpty,
  IsDateString,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'DateRange', async: false })
export class DateRangeValidator implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const startDate = (args.object as any).startDate;
    if (!startDate || !endDate) {
      return true; // Let other validators handle required checks
    }
    return new Date(endDate) >= new Date(startDate);
  }

  defaultMessage(args: ValidationArguments) {
    return 'End date must be greater than or equal to start date';
  }
}

export class CreateSprintDto {
  @IsString()
  @IsNotEmpty({ message: 'Sprint name is required' })
  name: string;

  @IsDateString({}, { message: 'Start date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: string;

  @IsDateString({}, { message: 'End date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'End date is required' })
  @Validate(DateRangeValidator)
  endDate: string;

  @IsString()
  @ValidateIf((o) => o.description !== undefined)
  description?: string;
}


