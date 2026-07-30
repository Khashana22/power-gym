import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ── Public API ───────────────────────────────────────────────────────

  async sendWelcomeMessage(memberId: string, fullName: string, phone: string) {
    const message = `مرحباً ${fullName}! 🎉 تم تسجيلك في Power Gym بنجاح. نتمنى لك تجربة رياضية رائعة!`;
    return this.dispatch(memberId, 'WELCOME', message, phone);
  }

  async sendExpiryReminder(memberId: string, fullName: string, phone: string, daysLeft: number) {
    const day = daysLeft === 1 ? 'غداً' : daysLeft === 0 ? 'اليوم' : `خلال ${daysLeft} أيام`;
    const message = `⚠️ تنبيه لـ ${fullName}: اشتراكك في Power Gym سينتهي ${day}. جدد الآن لتستمر في التدريب!`;
    return this.dispatch(memberId, 'EXPIRY_REMINDER', message, phone);
  }

  async sendExpiredNotification(memberId: string, fullName: string, phone: string) {
    const message = `❌ ${fullName}، انتهى اشتراكك في Power Gym. تواصل معنا لتجديد العضوية والعودة للتدريب!`;
    return this.dispatch(memberId, 'EXPIRED', message, phone);
  }

  async sendRenewalSuccess(memberId: string, fullName: string, phone: string, planName: string, endDate: Date) {
    const dateStr = endDate.toLocaleDateString('ar-EG');
    const message = `✅ ${fullName}، تم تجديد اشتراكك بنجاح! الباقة: ${planName} - صالح حتى: ${dateStr} 💪`;
    return this.dispatch(memberId, 'RENEWED', message, phone);
  }

  async sendPaymentSuccess(memberId: string, fullName: string, phone: string, amount: number, method: string) {
    const message = `💰 ${fullName}، تم استلام دفعتك بنجاح: ${amount} EGP بـ${method}. شكراً لك!`;
    return this.dispatch(memberId, 'PAYMENT_SUCCESS', message, phone);
  }

  async sendAttendanceConfirm(memberId: string, fullName: string, phone: string, daysLeft: number) {
    const message = `✅ ${fullName}، تم تسجيل حضورك اليوم في Power Gym! متبقي ${daysLeft} يوم على انتهاء اشتراكك. 💪`;
    return this.dispatch(memberId, 'ATTENDANCE_CONFIRM', message, phone);
  }

  async sendBirthdayMessage(memberId: string, fullName: string, phone: string) {
    const message = `🎂 كل عام وأنت بخير ${fullName}! فريق Power Gym يتمنى لك عيد ميلاد سعيد. استمر في التدريب وابق بصحة ممتازة! 💪`;
    return this.dispatch(memberId, 'BIRTHDAY', message, phone);
  }

  async sendAbsenceReminder(memberId: string, fullName: string, phone: string, days: number) {
    const message = `👋 ${fullName}، اشتقنا إليك! لم نرك في Power Gym منذ ${days} يوماً. عد إلينا وواصل رحلتك الرياضية!`;
    const type = days >= 30 ? 'ABSENCE_30' : 'ABSENCE_7';
    return this.dispatch(memberId, type as any, message, phone);
  }

  async sendFreezeNotification(memberId: string, fullName: string, phone: string, reason?: string) {
    const reasonText = reason ? ` السبب: ${reason}` : '';
    const message = `❄️ ${fullName}، تم تجميد اشتراكك في Power Gym.${reasonText} تواصل معنا عند رغبتك في الاستئناف.`;
    return this.dispatch(memberId, 'FREEZE', message, phone);
  }

  async sendUnfreezeNotification(memberId: string, fullName: string, phone: string) {
    const message = `🔥 ${fullName}، تم استئناف اشتراكك في Power Gym! مرحباً بعودتك. نراك في الصالة! 💪`;
    return this.dispatch(memberId, 'UNFREEZE', message, phone);
  }

  async sendCustomMessage(memberId: string, fullName: string, phone: string, message: string) {
    return this.dispatch(memberId, 'CUSTOM', message, phone);
  }

  /**
   * Send a membership card PDF via WhatsApp as a document.
   * Falls back to a text message if WhatsApp document API is not available.
   */
  async sendMembershipCard(
    memberId: string,
    fullName: string,
    phone: string,
    cardFilePath: string,
  ) {
    // Send a text notification first
    const textMessage = `🎫 ${fullName}، بطاقة عضويتك جاهزة! يمكنك استخدام رمز QR في الصالة لتسجيل حضورك.`;
    const notification = await this.dispatch(memberId, 'MEMBERSHIP_CARD', textMessage, phone);

    // Try to upload document to WhatsApp (if configured)
    const token = this.config.get<string>('WHATSAPP_TOKEN');
    const phoneId = this.config.get<string>('WHATSAPP_PHONE_ID');

    if (token && phoneId && cardFilePath && fs.existsSync(cardFilePath)) {
      await this.sendDocumentViaWhatsApp(phone, cardFilePath, `Membership Card - ${fullName}.pdf`, token, phoneId)
        .catch((err) => this.logger.warn(`Card document send failed: ${err?.message}`));
    }

    return notification;
  }

  async retryNotification(notificationId: string, phone: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) return null;
    if (notification.retryCount >= notification.maxRetries) {
      return this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED', errorMsg: 'Max retries exceeded' },
      });
    }
    return this.sendViaWhatsApp(notificationId, phone, notification.message);
  }

  // ── Internal ─────────────────────────────────────────────────────────

  private async dispatch(memberId: string, type: any, message: string, phone: string) {
    // Check for duplicate (same type in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existing = await this.prisma.notification.findFirst({
      where: { memberId, type, createdAt: { gte: oneHourAgo }, status: { not: 'FAILED' } },
    });
    if (existing) {
      this.logger.log(`Duplicate notification skipped for member ${memberId}, type ${type}`);
      return existing;
    }

    const notification = await this.prisma.notification.create({
      data: { memberId, type, message, status: 'PENDING' },
    });

    const token = this.config.get<string>('WHATSAPP_TOKEN');
    const phoneId = this.config.get<string>('WHATSAPP_PHONE_ID');

    if (!token || !phoneId) {
      this.logger.warn(`WhatsApp not configured. Notification ${notification.id} saved as PENDING.`);
      return notification;
    }

    return this.sendViaWhatsApp(notification.id, phone, message);
  }

  async sendViaWhatsApp(notificationId: string, phone: string, message: string) {
    const token = this.config.get<string>('WHATSAPP_TOKEN');
    const phoneId = this.config.get<string>('WHATSAPP_PHONE_ID');

    if (!token || !phoneId) {
      return this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'PENDING', errorMsg: 'WhatsApp not configured' },
      });
    }

    try {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'RETRYING', retryCount: { increment: 1 } },
      });

      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const intlPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;

      const res = await fetch(
        `https://graph.facebook.com/v20.0/${phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: intlPhone,
            type: 'text',
            text: { preview_url: false, body: message },
          }),
        },
      );

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const messageId = (data as any)?.messages?.[0]?.id;
        return this.prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            errorMsg: null,
            // Store WhatsApp message ID in summary if available
          },
        });
      }

      const errBody = await res.json().catch(() => ({}));
      const errMsg = (errBody as any)?.error?.message || JSON.stringify(errBody);
      return this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED', errorMsg: errMsg },
      });
    } catch (error: any) {
      this.logger.error('WhatsApp send failed', error);
      return this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED', errorMsg: error?.message || 'Unknown error' },
      });
    }
  }

  /**
   * Upload a document to WhatsApp using the Media Upload API and send it.
   */
  private async sendDocumentViaWhatsApp(
    phone: string,
    filePath: string,
    caption: string,
    token: string,
    phoneId: string,
  ): Promise<void> {
    // Step 1: Upload media
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', blob, fileName);
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', 'application/pdf');

    const uploadRes = await fetch(
      `https://graph.facebook.com/v20.0/${phoneId}/media`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(`Media upload failed: ${JSON.stringify(err)}`);
    }

    const uploadData = await uploadRes.json() as { id: string };
    const mediaId = uploadData.id;

    // Step 2: Send document message
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;

    const msgRes = await fetch(
      `https://graph.facebook.com/v20.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: intlPhone,
          type: 'document',
          document: {
            id: mediaId,
            caption,
            filename: fileName,
          },
        }),
      },
    );

    if (!msgRes.ok) {
      const err = await msgRes.json().catch(() => ({}));
      throw new Error(`Document send failed: ${JSON.stringify(err)}`);
    }

    this.logger.log(`Membership card sent via WhatsApp to ${phone}`);
  }

  // Retry all PENDING notifications (called by scheduler)
  async retryPending() {
    const pendings = await this.prisma.notification.findMany({
      where: { status: { in: ['PENDING', 'FAILED'] as any[] }, retryCount: { lt: 3 } },
      include: { member: { select: { phone: true } } },
      take: 20,
    });
    for (const n of pendings) {
      await this.sendViaWhatsApp(n.id, (n as any).member.phone, n.message).catch(() => undefined);
    }
  }
}
