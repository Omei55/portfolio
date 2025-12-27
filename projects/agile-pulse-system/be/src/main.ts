import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/errors/filters/global-exception.filter';
import { ValidationException } from './common/errors/exceptions/validation.exception';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Enable CORS for frontend communication
  // Allow CORS_ORIGIN from environment or default to common development ports
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const allowedOrigins = corsOrigin 
    ? corsOrigin.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];
  
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests) only in development
      if (!origin && !isProduction) {
        return callback(null, true);
      }
      // Allow wildcard or exact matches
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (!isProduction) {
        // In development, be more permissive
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
  
  // Register global exception filter for centralized error handling
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        // Transform validation errors to use our custom format
        const messages = errors.map((error) => {
          const constraints = error.constraints || {};
          return Object.values(constraints).join(', ');
        });
        return new ValidationException(
          'Validation failed',
          messages.length === 1 ? messages[0] : messages,
        );
      },
    }),
  );

  // Enable global response transformation for standardized API responses
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  
  // Enable global exception filter for standardized error responses
  app.useGlobalFilters(new HttpExceptionFilter());
  
  await app.listen(3001);
}
bootstrap();
