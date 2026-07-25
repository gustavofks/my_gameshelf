import { Controller, Get, Query } from '@nestjs/common';
import { LibraryService } from './library.service';

@Controller('games')
export class LibraryController {
  constructor(private readonly library: LibraryService) {}

  @Get()
  list(
    @Query('platform') platform?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.library.list({
      platform,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}
