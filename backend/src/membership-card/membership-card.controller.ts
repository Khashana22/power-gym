import {
  Controller, Get, Param, Res, UseGuards, Req,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { MembershipCardService } from './membership-card.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as fs from 'fs';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; gymId: string; role: string };
}

@UseGuards(JwtAuthGuard)
@Controller('membership-card')
export class MembershipCardController {
  constructor(private readonly cardService: MembershipCardService) {}

  @Get(':memberId/generate/:subscriptionId')
  async generate(
    @Req() req: AuthenticatedRequest,
    @Param('memberId') memberId: string,
    @Param('subscriptionId') subscriptionId: string,
    @Res() res: Response,
  ) {
    const filePath = await this.cardService.generateAndSendCard(memberId, subscriptionId);
    if (!filePath) {
      return res.status(404).json({ error: 'Could not generate card' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="membership-card-${memberId}.pdf"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  @Get(':memberId/list')
  async listCards(
    @Req() req: AuthenticatedRequest,
    @Param('memberId') memberId: string,
  ) {
    const cards = this.cardService.listMemberCards(memberId);
    return { cards };
  }
}
