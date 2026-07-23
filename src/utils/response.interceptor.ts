import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse();
    const statusCode = res.statusCode ?? 200;
    return next.handle().pipe(
      map((data: T) => ({
        statusCode,
        message: "Success",
        data
      }))
    );
  }
}
