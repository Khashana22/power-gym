import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await argon2.hash(dto.password);

    const gym = await this.prisma.gym.create({
      data: {
        name: dto.gymName,
        settings: {
          create: {
            gymName: dto.gymName,
          },
        },
      },
    });

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        password: hashedPassword,
        role: 'OWNER',
        gymId: gym.id,
      },
    });

    // Audit log the gym creation
    await this.audit.log(
      { gymId: gym.id, userId: user.id },
      'CREATE',
      'Gym',
      gym.id,
      `Gym registered: ${dto.gymName}`,
    );

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.password, dto.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Audit log
    await this.audit.log(
      { gymId: user.gymId, userId: user.id, ip, userAgent },
      'LOGIN',
      'User',
      user.id,
      `Login: ${user.email} (${user.role})`,
    );

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    gymId: string;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      gymId: user.gymId,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}