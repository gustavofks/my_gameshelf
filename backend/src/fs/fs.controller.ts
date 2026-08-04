import { Controller, Get, Query } from '@nestjs/common';
import { FsService } from './fs.service';

@Controller('fs')
export class FsController {
  constructor(private readonly fsService: FsService) {}

  @Get('directories')
  listDirectories(@Query('path') path?: string) {
    return this.fsService.listDirectories(path);
  }
}
