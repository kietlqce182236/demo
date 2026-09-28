import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { Step1Dto, Step2Dto, Step3Dto } from './dto/seal-sample.dto';

@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post('step1')
  async createStep1(@Body() dto: Step1Dto) {
    return await this.inspectionsService.createStep1(dto);
  }

  @Patch(':id/step2')
  async updateStep2(@Param('id') id: string, @Body() dto: Step2Dto) {
    return await this.inspectionsService.updateStep2(id, dto);
  }

  @Patch(':id/step3')
  async updateStep3(@Param('id') id: string, @Body() dto: Step3Dto) {
    return await this.inspectionsService.updateStep3(id, dto);
  }

  @Get('samples')
  async getRecords() {
    return await this.inspectionsService.getRecords();
  }

  @Get('samples/:id')
  async getRecordById(@Param('id') id: string) {
    return await this.inspectionsService.getRecordById(id);
  }

  @Patch('samples/:id/dispose')
  async disposeSample(@Param('id') id: string) {
    return await this.inspectionsService.disposeSample(id);
  }
}
