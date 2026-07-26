import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Body() dto: CreateMemberDto) {
    const gymId = 'cms1zcrxl00001knfh13hb3mn';
    return this.membersService.create(gymId, dto);
  }

  @Get()
  findAll() {
    const gymId = 'cms1zcrxl00001knfh13hb3mn';
    return this.membersService.findAll(gymId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const gymId = 'cms1zcrxl00001knfh13hb3mn';
    return this.membersService.findOne(gymId, id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    const gymId = 'cms1zcrxl00001knfh13hb3mn';
    return this.membersService.update(gymId, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const gymId = 'cms1zcrxl00001knfh13hb3mn';
    return this.membersService.remove(gymId, id);
  }
}