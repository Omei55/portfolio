import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode || HttpStatus.OK;

    return next.handle().pipe(
      map((data) => {
        // If response is already an ApiResponseDto, return as is
        if (data instanceof ApiResponseDto) {
          return data;
        }

        // If response is null/undefined and status is 204, return success message
        if (statusCode === HttpStatus.NO_CONTENT) {
          return ApiResponseDto.noContent('Operation completed successfully');
        }

        // For GET requests, return success with data
        if (request.method === 'GET') {
          return ApiResponseDto.success(data, 'Data retrieved successfully');
        }

        // For POST requests (create), return created response
        if (request.method === 'POST' && statusCode === HttpStatus.CREATED) {
          return ApiResponseDto.created(data, 'Resource created successfully');
        }

        // For PATCH/PUT requests (update), return success with update message
        if (request.method === 'PATCH' || request.method === 'PUT') {
          return ApiResponseDto.success(data, 'Resource updated successfully');
        }

        // For DELETE requests, return success with delete message
        if (request.method === 'DELETE') {
          return ApiResponseDto.noContent('Resource deleted successfully');
        }

        // Default: wrap in success response
        return ApiResponseDto.success(data);
      }),
    );
  }
}

