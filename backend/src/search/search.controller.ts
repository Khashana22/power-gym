import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; gymId: string; role: string };
}

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async search(
    @Req() req: AuthenticatedRequest,
    @Query('q') q: string,
  ) {
    if (!q || q.trim().length < 2) return { members: [], results: [] };
    const gymId = req.user.gymId;
    const query = q.trim();

    const [members, plans] = await Promise.all([
      this.prisma.member.findMany({
        where: {
          gymId,
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query } },
            { memberCode: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          fullName: true,
          memberCode: true,
          phone: true,
          photo: true,
          isActive: true,
        },
        take: 10,
      }),
      this.prisma.membershipPlan.findMany({
        where: {
          gymId,
          name: { contains: query, mode: 'insensitive' },
          isActive: true,
        },
        select: { id: true, name: true, durationDays: true, price: true },
        take: 5,
      }),
    ]);

    const results = [
      ...members.map((m) => ({
        type: 'member' as const,
        id: m.id,
        title: m.fullName,
        subtitle: `${m.memberCode} · ${m.phone}`,
        href: `/members/${m.id}`,
        photo: m.photo,
        isActive: m.isActive,
      })),
      ...plans.map((p) => ({
        type: 'plan' as const,
        id: p.id,
        title: p.name,
        subtitle: `${p.durationDays} days · ${p.price} EGP`,
        href: `/plans`,
      })),
    ];

    return { results, members };
  }
}
