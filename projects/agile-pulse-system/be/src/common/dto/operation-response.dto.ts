export class OperationResponseDto<T = any> {
  success: boolean;
  message: string;
  data?: T;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static success<T>(message: string, data?: T): OperationResponseDto<T> {
    return new OperationResponseDto(true, message, data);
  }

  static error(message: string): OperationResponseDto {
    return new OperationResponseDto(false, message);
  }
}

