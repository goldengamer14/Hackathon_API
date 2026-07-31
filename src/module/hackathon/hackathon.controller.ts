import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { AllowAnonymous, Roles, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { ResponseInterceptor } from '../../utils/response.interceptor.js';
import { ResponseMessage } from '../../common/decorators/response-message.decorator.js';
import { HackathonService } from './hackathon.service.js';
import { CreateHackathonDto } from './dto/create-hackathon.dto.js';
import { UpdateHackathonDto } from './dto/update-hackathon.dto.js';

@UseInterceptors(ResponseInterceptor)
@Controller('hackathons')
export class HackathonController {
  constructor(private readonly hackathonService: HackathonService) { }

  @Get()
  @AllowAnonymous()
  async findAll() {
    return this.hackathonService.findAll();
  }

  @Get(':id')
  @AllowAnonymous()
  async findOne(@Param('id') id: string) {
    return this.hackathonService.findOne(id);
  }

  @Post()
  @Roles(['ADMIN'])
  @ResponseMessage('Hackathon created successfully')
  async create(@Body() dto: CreateHackathonDto, @Session() session: UserSession) {
    return this.hackathonService.create(dto, session.user.id);
  }

  @Patch(':id')
  @Roles(['ADMIN'])
  @ResponseMessage('Hackathon updated successfully')
  async update(@Param('id') id: string, @Body() dto: UpdateHackathonDto) {
    return this.hackathonService.update(id, dto);
  }

  @Delete(':id')
  @Roles(['ADMIN'])
  @ResponseMessage('Hackathon deleted successfully')
  async remove(@Param('id') id: string) {
    await this.hackathonService.remove(id);
    return null;
  }
}
