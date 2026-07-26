import { Controller, Get, Param, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { AllowAnonymous, Roles } from '@thallesp/nestjs-better-auth';
import { UserService } from './user.service.js';
import { ResponseInterceptor } from '../../utils/response.interceptor.js';

@UseInterceptors(ResponseInterceptor)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('all')
  @Roles(["ADMIN"])
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
