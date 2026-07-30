import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(gymId: string, dto: CreateMemberDto) {
    const existing = await this.prisma.member.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new ConflictException('Phone number already registered');
    }

    // Find the highest existing memberCode number to generate next sequential code
    const lastMember = await this.prisma.member.findFirst({
      where: { gymId },
      orderBy: { createdAt: 'desc' },
      select: { memberCode: true },
    });

    let nextNum = 1001;
    if (lastMember?.memberCode) {
      // Extract numeric part from codes like PG-1001, PG-1002, PG-2026-000001, etc.
      const match = lastMember.memberCode.match(/\d+$/);
      if (match) {
        const parsed = parseInt(match[0], 10);
        // Handle both old format (6-digit padded) and new format (starting at 1001)
        nextNum = parsed < 1001 ? 1001 : parsed + 1;
      }
    }

    // Find the globally highest code to handle any ordering gaps
    const allCodes = await this.prisma.member.findMany({
      where: { gymId },
      select: { memberCode: true },
    });
    for (const m of allCodes) {
      const match = m.memberCode.match(/\d+$/);
      if (match) {
        const parsed = parseInt(match[0], 10);
        const candidate = parsed < 1001 ? 1001 : parsed + 1;
        if (candidate > nextNum) nextNum = candidate;
      }
    }

    const memberCode = `PG-${nextNum}`;
    const qrToken = crypto.randomUUID();

    const member = await this.prisma.member.create({
      data: {
        ...dto,
        gymId,
        memberCode,
        qrToken,
      },
    });

    this.notifications
      .sendWelcomeMessage(member.id, member.fullName, member.phone)
      .catch(() => undefined);

    return member;
  }

  async findAll(gymId: string, search?: string, includeInactive?: boolean) {
    const where: any = { gymId };
    if (!includeInactive) where.isActive = true;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { memberCode: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        subscriptions: {
          orderBy: { endDate: 'desc' },
          take: 1,
          include: { plan: { select: { name: true } } },
        },
      },
    });
  }

  async findOne(gymId: string, id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, gymId },
      include: {
        subscriptions: {
          orderBy: { startDate: 'desc' },
          include: { plan: true, payments: { orderBy: { paidAt: 'desc' } } },
        },
        attendance: {
          orderBy: { checkIn: 'desc' },
          take: 30,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async findByQr(gymId: string, qrToken: string) {
    const member = await this.prisma.member.findFirst({
      where: { qrToken, gymId },
      include: {
        subscriptions: {
          orderBy: { endDate: 'desc' },
          take: 1,
          include: { plan: { select: { name: true } } },
        },
      },
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
