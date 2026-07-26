import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(gymId: string, dto: CreateMemberDto) {
    const existing = await this.prisma.member.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new ConflictException('Phone number already registered');
    }

    const memberCode = `PG-${Date.now()}`;
    const qrToken = crypto.randomUUID();

    return this.prisma.member.create({
      data: {
        ...dto,
        gymId,
        memberCode,
        qrToken,
      },
    });
  }

  async findAll(gymId: string) {
    return this.prisma.member.findMany({
      where: { gymId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(gymId: string, id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, gymId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async update(gymId: string, id: string, dto: UpdateMemberDto) {
    await this.findOne(gymId, id);

    return this.prisma.member.update({
      where: { id },
      data: dto,
    });
  }

  async remove(gymId: string, id: string) {
    await this.findOne(gymId, id);

    return this.prisma.member.update({
      where: { id },
      data: { isActive: false },
    });
  }
}