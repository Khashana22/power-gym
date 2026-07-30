import { MembershipCardService } from './membership-card.service';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as QRCode from 'qrcode';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    gymId: string;
    role: string;
  };
}

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads', 'photos');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

@UseGuards(JwtAuthGuard)
@Controller('members')
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly membershipCardService: MembershipCardService,
  ) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateMemberDto) {
    return this.membersService.create(req.user.gymId, dto);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.membersService.findAll(
      req.user.gymId,
      search,
      includeInactive === 'true',
    );
  }

  @Get('qr/:qrToken')
  findByQr(@Req() req: AuthenticatedRequest, @Param('qrToken') qrToken: string) {
    return this.membersService.findByQr(req.user.gymId, qrToken);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.membersService.findOne(req.user.gymId, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.update(req.user.gymId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.membersService.remove(req.user.gymId, id);
  }

  /** GET /members/:id/qr — returns QR code as PNG image */
  @Get(':id/qr')
  async getQrCode(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('format') format: 'png' | 'svg' = 'png',
    @Res() res: Response,
  ) {
    const member = await this.membersService.findOne(req.user.gymId, id);
    const qrData = `POWERGYM:${member.qrToken}`;

    if (format === 'svg') {
      const svg = await QRCode.toString(qrData, { type: 'svg', width: 300, margin: 2 });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `inline; filename="${member.memberCode}-qr.svg"`);
      return res.send(svg);
    }

    const buffer = await QRCode.toBuffer(qrData, {
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: '#09090B', light: '#FFFFFF' },
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${member.memberCode}-qr.png"`);
    return res.send(buffer);
  }

  /** GET /members/:id/card — download membership card PDF */
  @Get(':id/card')
  async getMembershipCard(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const member = await this.membersService.findOne(req.user.gymId, id);
    const buffer = await this.membershipCardService.generateCard(req.user.gymId, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${member.memberCode}-card.pdf"`);
    return res.send(buffer);
  }

  /** POST /members/:id/photo — upload member photo */
  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `photo-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadPhoto(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /image\/(jpeg|jpg|png|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const photoUrl = `/uploads/photos/${file.filename}`;
    return this.membersService.update(req.user.gymId, id, { photo: photoUrl } as any);
  }
}