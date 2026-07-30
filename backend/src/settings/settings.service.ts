import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(gymId: string) {
    let settings = await this.prisma.gymSettings.findUnique({ where: { gymId } });
    if (!settings) {
      // Bootstrap from gym record
      const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
      settings = await this.prisma.gymSettings.create({
        data: {
          gymId,
          gymName: gym?.name,
          phone: gym?.phone,
          address: gym?.address,
        },
      });
    }
    return settings;
  }

  async update(gymId: string, dto: UpdateSettingsDto) {
    await this.get(gymId); // ensure exists
    return this.prisma.gymSettings.update({
      where: { gymId },
      data: dto,
    });
  }
}
