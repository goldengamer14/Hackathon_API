import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service.js';
import { CreateHackathonDto } from './dto/create-hackathon.dto.js';
import { UpdateHackathonDto } from './dto/update-hackathon.dto.js';

@Injectable()
export class HackathonService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll() {
    return this.prismaService.client.hackathon.findMany({
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const hackathon = await this.prismaService.client.hackathon.findUnique({
      where: { id },
    });

    if (!hackathon) {
      throw new NotFoundException(`Hackathon with id ${id} not found.`);
    }

    return hackathon;
  }

  async create(dto: CreateHackathonDto, authorId: string) {
    return this.prismaService.client.hackathon.create({
      data: {
        ...dto,
        authorId,
      },
    });
  }

  async update(id: string, dto: UpdateHackathonDto) {
    await this.findOne(id); // throws 404 early if missing

    return this.prismaService.client.hackathon.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // throws 404 early if missing

    await this.prismaService.client.hackathon.delete({
      where: { id },
    });
  }
}
