import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message: string;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseEnvelope<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode || 200;

    return next.handle().pipe(
      map((resData) => {
        // If data is already structured with success flag, return as is
        if (resData && typeof resData === 'object' && 'success' in resData && 'data' in resData) {
          return resData;
        }

        // If data has meta property (e.g. pagination)
        if (resData && typeof resData === 'object' && 'items' in resData && 'meta' in resData) {
          return {
            success: true,
            statusCode,
            data: resData.items,
            meta: resData.meta,
            message: 'Thành công',
          };
        }

        return {
          success: true,
          statusCode,
          data: resData,
          message: 'Thành công',
        };
      }),
    );
  }
}
