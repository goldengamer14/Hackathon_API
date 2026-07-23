import { ARCJET, type ArcjetNest } from '@arcjet/nest';
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(ARCJET) private readonly arcjet: ArcjetNest,
  ) {}

  @Get()
  async getHello(@Req() req: Request): Promise<string> {
    await this.assertAllowed(req);
    return this.appService.getHello();
  }

  @Get('matches')
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
