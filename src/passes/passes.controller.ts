import {
  Body,
  Controller,
  Param,
  Post,
} from '@nestjs/common';

import { PassesService } from './passes.service';
import { CreatePassDto } from './dto/create-pass.dto';
import { UpdatePassDto } from './dto/update-pass.dto';

@Controller('passes')
export class PassesController {
  constructor(
    private readonly passesService: PassesService,
  ) {}

  @Post()
  async createPass(@Body() createPassDto: CreatePassDto) {
    return this.passesService.createPass(createPassDto);
  }

  @Post(':id')
async updatePass(
  @Param('id') passId: string,
  @Body() updatePassDto: UpdatePassDto,
) {
  return this.passesService.updatePass(
    passId,
    updatePassDto.value,
  );
}
}