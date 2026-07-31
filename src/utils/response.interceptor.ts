import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from '../common/decorators/response-message.decorator.js';


@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor {
  constructor(private readonly reflector: Reflector) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse();
    const statusCode = res.statusCode ?? 200;
    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ?? 'Success';


    return next.handle().pipe(
      map((data: T) => ({
        statusCode,
        message,
        data
      }))
    );
  }
}
