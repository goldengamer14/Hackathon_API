import { ARCJET, type ArcjetNest } from '@arcjet/nest';
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { Request } from 'express';
import { AppService } from './app.service.js';
import { ResponseInterceptor } from './utils/response.interceptor.js';

@UseInterceptors(ResponseInterceptor)
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(ARCJET) private readonly arcjet: ArcjetNest,
  ) {}

  @Get()
  @AllowAnonymous()
  async getHello(@Req() req: Request): Promise<string> {
    await this.assertAllowed(req);
    return this.appService.getHello();
  }

  @Get('matches')
  @AllowAnonymous()
  async getMatches(@Req() req: Request): Promise<string> {
    await this.assertAllowed(req);
    return this.appService.getMatches();
  }

  private async assertAllowed(req: Request): Promise<void> {
    const decision = await this.arcjet.protect(req);

    if (decision.isDenied()) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
