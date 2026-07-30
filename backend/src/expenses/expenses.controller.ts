import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req
} from '@nestjs/common';
import { Request } from 'express';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; gymId: string; role: string };
}

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(req.user.gymId, dto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query('month') month?: string) {
    return this.expensesService.findAll(req.user.gymId, month);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expensesService.remove(req.user.gymId, id);
  }
}
