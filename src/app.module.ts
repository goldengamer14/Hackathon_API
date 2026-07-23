import { ArcjetModule, shield, fixedWindow } from '@arcjet/nest';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './lib/database/prisma.module.js';

import 'dotenv/config.js';

@Module({
  imports: [
    PrismaModule,
    ArcjetModule.forRoot({
      isGlobal: true,
      key: process.env.ARCJET_KEY!,
      rules: [
        shield({ mode: 'LIVE' }),
        fixedWindow({
          mode: 'LIVE',
          window: '60s',
          max: 20,
        }),
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
