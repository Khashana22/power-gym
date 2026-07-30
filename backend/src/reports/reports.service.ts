import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Writable } from 'stream';

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(filter: ReportFilter) {
    const end = filter.endDate ? new Date(filter.endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    const start = filter.startDate
      ? new Date(filter.startDate)
      : new Date(end.getFullYear(), end.getMonth(), 1); // Default: current month
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  async getRevenueReport(gymId: string, filter: ReportFilter) {
    const { start, end } = this.getDateRange(filter);

    // Daily revenue breakdown
    const payments = await this.prisma.payment.findMany({
      where: {
        paidAt: { gte: start, lte: end },
        subscription: { member: { gymId } },
      },
      include: {
        subscription: {
          include: {
            member: { select: { fullName: true, memberCode: true } },
            plan: { select: { name: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    // Group by day
    const byDay: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    let total = 0;

    for (const p of payments) {
      const day = p.paidAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + p.amount;
      byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
      total += p.amount;
    }

    const chart = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    return { total, chart, byMethod, payments };
  }

  async getAttendanceReport(gymId: string, filter: ReportFilter) {
    const { start, end } = this.getDateRange(filter);

    const records = await this.prisma.attendance.findMany({
      where: {
        checkIn: { gte: start, lte: end },
        member: { gymId },
      },
      include: {
        member: { select: { fullName: true, memberCode: true, phone: true } },
      },
      orderBy: { checkIn: 'desc' },
    });

    // Group by day
    const byDay: Record<string, number> = {};
    for (const r of records) {
      const day = r.checkIn.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    }

    const chart = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const uniqueMembers = new Set(records.map((r) => r.memberId)).size;

    return {
      total: records.length,
      uniqueMembers,
      chart,
      records: records.slice(0, 200),
    };
  }

  async getMembersReport(gymId: string, filter: ReportFilter) {
    const { start, end } = this.getDateRange(filter);

    const [newMembers, totalActive, expiringSoon, expiringThisMonth] =
      await Promise.all([
        this.prisma.member.findMany({
          where: { gymId, createdAt: { gte: start, lte: end } },
          select: {
            id: true,
            fullName: true,
            memberCode: true,
            phone: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.member.count({ where: { gymId, isActive: true } }),
        this.prisma.subscription.count({
          where: {
            status: 'ACTIVE',
            endDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 86400000),
            },
            member: { gymId },
          },
        }),
        this.prisma.subscription.count({
          where: {
            status: 'ACTIVE',
            endDate: {
              gte: new Date(end.getFullYear(), end.getMonth(), 1),
              lte: new Date(end.getFullYear(), end.getMonth() + 1, 0),
            },
            member: { gymId },
          },
        }),
      ]);

    return { newMembers, totalActive, expiringSoon, expiringThisMonth };
  }

  async exportRevenuePdf(gymId: string, filter: ReportFilter): Promise<Buffer> {
    const { total, chart, byMethod, payments } = await this.getRevenueReport(gymId, filter);
    const { start, end } = this.getDateRange(filter);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(22).font('Helvetica-Bold').text('POWER GYM', { align: 'center' });
      doc.fontSize(14).font('Helvetica').text('Revenue Report', { align: 'center' });
      doc.fontSize(10).text(
        `Period: ${start.toLocaleDateString('en-EG')} — ${end.toLocaleDateString('en-EG')}`,
        { align: 'center' },
      );
      doc.moveDown();

      // Summary
      doc.fontSize(12).font('Helvetica-Bold').text('Summary');
      doc.font('Helvetica').fontSize(11);
      doc.text(`Total Revenue: ${total.toLocaleString()} EGP`);
      doc.moveDown(0.5);
      doc.text('By Payment Method:');
      for (const [method, amount] of Object.entries(byMethod)) {
        doc.text(`  • ${method}: ${(amount as number).toLocaleString()} EGP`);
      }
      doc.moveDown();

      // Transactions table
      doc.fontSize(12).font('Helvetica-Bold').text('Transaction Details');
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica');

      const colX = [40, 130, 250, 360, 440];
      doc.font('Helvetica-Bold');
      ['Date', 'Member', 'Plan', 'Method', 'Amount'].forEach((h, i) =>
        doc.text(h, colX[i], doc.y, { continued: i < 4 }),
      );
      doc.font('Helvetica').moveDown(0.2);
      doc
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .strokeColor('#cccccc')
        .stroke();
      doc.moveDown(0.2);

      for (const p of payments.slice(0, 100)) {
        if (doc.y > 750) doc.addPage();
        const y = doc.y;
        doc.text(p.paidAt.toLocaleDateString('en-EG'), colX[0], y);
        doc.text(p.subscription.member.fullName.substring(0, 18), colX[1], y);
        doc.text(p.subscription.plan.name.substring(0, 18), colX[2], y);
        doc.text(p.method, colX[3], y);
        doc.text(`${p.amount} EGP`, colX[4], y);
        doc.moveDown(0.5);
      }

      doc.end();
    });
  }

  async exportRevenueExcel(gymId: string, filter: ReportFilter): Promise<Buffer> {
    const { total, byMethod, payments } = await this.getRevenueReport(gymId, filter);
    const { start, end } = this.getDateRange(filter);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Power Gym';
    wb.created = new Date();

    // Summary sheet
    const summary = wb.addWorksheet('Summary');
    summary.addRow(['Power Gym — Revenue Report']);
    summary.addRow([`Period: ${start.toLocaleDateString()} — ${end.toLocaleDateString()}`]);
    summary.addRow([]);
    summary.addRow(['Total Revenue', total]);
    summary.addRow([]);
    summary.addRow(['Payment Method', 'Amount (EGP)']);
    for (const [method, amount] of Object.entries(byMethod)) {
      summary.addRow([method, amount]);
    }
    summary.getColumn(1).width = 25;
    summary.getColumn(2).width = 20;

    // Transactions sheet
    const sheet = wb.addWorksheet('Transactions');
    sheet.addRow(['Date', 'Member Code', 'Member Name', 'Plan', 'Method', 'Amount (EGP)', 'Notes']);
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E1E2E' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    for (const p of payments) {
      sheet.addRow([
        p.paidAt.toLocaleDateString(),
        p.subscription.member.memberCode,
        p.subscription.member.fullName,
        p.subscription.plan.name,
        p.method,
        p.amount,
        '',
      ]);
    }

    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((col, i) => {
      sheet.getColumn(col).width = [15, 15, 25, 20, 18, 15, 20][i];
    });

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  async exportAttendanceExcel(gymId: string, filter: ReportFilter): Promise<Buffer> {
    const { records, total, uniqueMembers } = await this.getAttendanceReport(gymId, filter);
    const { start, end } = this.getDateRange(filter);

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Attendance');
    sheet.addRow(['Power Gym — Attendance Report']);
    sheet.addRow([`Period: ${start.toLocaleDateString()} — ${end.toLocaleDateString()}`]);
    sheet.addRow([`Total Check-ins: ${total}`, `Unique Members: ${uniqueMembers}`]);
    sheet.addRow([]);
    sheet.addRow(['Date', 'Time', 'Member Code', 'Member Name', 'Phone']);
    sheet.getRow(5).font = { bold: true };

    for (const r of records) {
      sheet.addRow([
        r.checkIn.toLocaleDateString(),
        r.checkIn.toLocaleTimeString(),
        r.member.memberCode,
        r.member.fullName,
        r.member.phone,
      ]);
    }

    ['A', 'B', 'C', 'D', 'E'].forEach((col, i) => {
      sheet.getColumn(col).width = [15, 12, 16, 25, 16][i];
    });

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }
}
