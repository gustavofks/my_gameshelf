import { Controller, Get, Post, Param, Body, HttpCode } from '@nestjs/common';
import { ScannerService } from './scanner.service';

interface StartScanBody {
  rootPath?: string;
}

@Controller('scans')
export class ScannerController {
  constructor(private readonly scanner: ScannerService) {}

  @Post()
  @HttpCode(202)
  start(@Body() body: StartScanBody) {
    return this.scanner.start(body?.rootPath);
  }

  @Get(':id')
  status(@Param('id') id: string) {
    return this.scanner.status(id);
  }
}
