import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

@Injectable()
export class MembershipCardService {
  constructor(private readonly prisma: PrismaService) {}

  async generateCard(gymId: string, memberId: string): Promise<Buffer> {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gymId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1,
          include: { plan: true },
        },
        gym: { include: { settings: true } },
      },
    });

    if (!member) throw new Error('Member not found');

    const sub = member.subscriptions[0];
    const gymName = member.gym.settings?.gymName || member.gym.name || 'POWER GYM';
    const qrData = `POWERGYM:${member.qrToken}`;

    // Generate QR code as data URL (base64 PNG)
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 160,
      margin: 1,
      color: { dark: '#09090B', light: '#FFFFFF' },
    });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    return new Promise((resolve, reject) => {
      // Credit-card size: 85.6mm × 54mm → in points (72 dpi): ~243 × 153 pts
      const W = 243;
      const H = 153;
      const doc = new PDFDocument({ size: [W, H], margin: 0 });
      const chunks: Buffer[] = [];

      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Background gradient-like dark card
      doc.rect(0, 0, W, H).fill('#09090B');

      // Accent stripe
      doc.rect(0, 0, 6, H).fill('#F97316');

      // Gym name top
      doc.fillColor('#F97316').fontSize(9).font('Helvetica-Bold').text(gymName, 14, 12, { width: 150 });

      // MEMBERSHIP CARD label
      doc.fillColor('#6B7280').fontSize(6).font('Helvetica').text('MEMBERSHIP CARD', 14, 24);

      // Member name
      doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text(member.fullName, 14, 40, { width: 150 });

      // Member code
      doc.fillColor('#9CA3AF').fontSize(7).font('Helvetica').text(member.memberCode, 14, 57);

      // Phone
      doc.fillColor('#9CA3AF').fontSize(7).text(member.phone, 14, 68);

      // Plan and expiry
      if (sub) {
        doc.fillColor('#D1D5DB').fontSize(7).text(`Plan: ${sub.plan.name}`, 14, 82);
        doc.text(
          `Expires: ${sub.endDate.toLocaleDateString('en-EG', { day: '2-digit', month: 'short', year: 'numeric' })}`,
          14,
          93,
        );
      } else {
        doc.fillColor('#EF4444').fontSize(7).text('No Active Subscription', 14, 82);
      }

      // QR code
      doc.image(qrBuffer, W - 80, (H - 70) / 2, { width: 70, height: 70 });

      // Bottom strip
      doc.rect(0, H - 14, W, 14).fill('#1A1A2E');
      doc.fillColor('#6B7280').fontSize(5.5).text('Scan QR at reception for check-in', 14, H - 10);

      doc.end();
    });
  }
}
