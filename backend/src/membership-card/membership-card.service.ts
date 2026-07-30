import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode = require('qrcode');

export interface MembershipCardData {
  memberId: string;
  memberCode: string;
  fullName: string;
  phone: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  qrToken: string;
  gymName: string;
  gymLogo?: string;
  primaryColor?: string;
}

@Injectable()
export class MembershipCardService {
  private readonly logger = new Logger(MembershipCardService.name);
  private readonly cardsDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.cardsDir = path.join(process.cwd(), 'uploads', 'cards');
    if (!fs.existsSync(this.cardsDir)) {
      fs.mkdirSync(this.cardsDir, { recursive: true });
    }
  }

  async generateCard(data: MembershipCardData): Promise<string> {
    const fileName = `card-${data.memberId}-${Date.now()}.pdf`;
    const filePath = path.join(this.cardsDir, fileName);

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(
      `${this.config.get('APP_URL') || 'https://powergym.app'}/attendance/qr/${data.qrToken}`,
      { width: 200, margin: 1, color: { dark: '#000000', light: '#FFFFFF' } },
    );

    // Convert data URL to buffer
    const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(qrBase64, 'base64');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [600, 340],
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const primary = data.primaryColor || '#F97316';

      // Background
      doc.rect(0, 0, 600, 340).fill('#0F172A');

      // Top accent bar
      doc.rect(0, 0, 600, 8).fill(primary);

      // Gym name
      doc
        .font('Helvetica-Bold')
        .fontSize(28)
        .fillColor(primary)
        .text(data.gymName, 30, 30, { align: 'left' });

      // Member name
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#FFFFFF')
        .text(data.fullName, 30, 75, { align: 'left' });

      // Member code
      doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#94A3B8')
        .text(`عضو رقم: ${data.memberCode}`, 30, 103, { align: 'left' });

      // Plan divider line
      doc
        .moveTo(30, 125)
        .lineTo(420, 125)
        .strokeColor(primary)
        .lineWidth(1)
        .stroke();

      // Plan info
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#FFFFFF')
        .text(`الباقة: ${data.planName}`, 30, 140);

      // Dates
      const startStr = data.startDate.toLocaleDateString('ar-EG');
      const endStr = data.endDate.toLocaleDateString('ar-EG');
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#94A3B8')
        .text(`تاريخ البداية: ${startStr}`, 30, 170)
        .text(`تاريخ الانتهاء: ${endStr}`, 30, 190);

      // Phone
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#94A3B8')
        .text(`📞 ${data.phone}`, 30, 215);

      // Powered by
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#475569')
        .text('Powered by Power Gym Management System', 30, 305);

      // QR code
      doc.image(qrBuffer, 450, 30, { width: 120, height: 120 });

      // QR label
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#64748B')
        .text('امسح للحضور', 453, 155, { width: 120, align: 'center' });

      // Bottom accent bar
      doc.rect(0, 332, 600, 8).fill(primary);

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  async generateAndSendCard(memberId: string, subscriptionId: string) {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: { id: subscriptionId, memberId },
        include: {
          member: true,
          plan: true,
        },
      });

      if (!subscription) {
        this.logger.warn(`Subscription ${subscriptionId} not found for member ${memberId}`);
        return null;
      }

      const gym = await this.prisma.gym.findUnique({
        where: { id: subscription.member.gymId },
        include: { settings: true },
      });

      const gymName = gym?.settings?.gymName || gym?.name || 'Power Gym';
      const primaryColor = gym?.settings?.primaryColor || '#F97316';

      const cardData: MembershipCardData = {
        memberId,
        memberCode: subscription.member.memberCode,
        fullName: subscription.member.fullName,
        phone: subscription.member.phone,
        planName: subscription.plan.name,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        qrToken: subscription.member.qrToken,
        gymName,
        primaryColor,
      };

      const filePath = await this.generateCard(cardData);
      this.logger.log(`Membership card generated: ${filePath}`);
      return filePath;
    } catch (error: any) {
      this.logger.error('Failed to generate membership card', error?.message);
      return null;
    }
  }

  // Get card file path for download
  getCardPath(fileName: string): string | null {
    const filePath = path.join(this.cardsDir, fileName);
    if (fs.existsSync(filePath)) return filePath;
    return null;
  }

  // List all cards for a member
  listMemberCards(memberId: string): string[] {
    const files = fs.readdirSync(this.cardsDir);
    return files.filter((f) => f.startsWith(`card-${memberId}-`));
  }
}
