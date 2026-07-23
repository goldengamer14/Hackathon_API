import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getMatches(): string {
    return 'Arcjet protected matches endpoint';
  }
}
