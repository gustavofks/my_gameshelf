import { Controller, Get, Post, Param, HttpCode } from '@nestjs/common';
import { ScannerService } from './scanner.service';

@Controller('scans')
export class ScannerController {
  constructor(private readonly scanner: ScannerService) {}

  @Post()
  @HttpCode(202)
  start() {
    return this.scanner.start();
  }

  @Get(':id')
  status(@Param('id') id: string) {
    return this.scanner.status(id);
  }
}
