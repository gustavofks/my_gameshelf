import { Controller, Get, Query } from '@nestjs/common';
import { LibraryService } from './library.service';

/** Parses a query string to a finite number, or undefined for junk like "abc". */
function toNumber(value?: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

@Controller()
export class LibraryController {
  constructor(private readonly library: LibraryService) {}

  @Get('games')
  list(
    @Query('platform') platform?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.library.list({
      platform,
      search,
      page: toNumber(page),
      pageSize: toNumber(pageSize),
    });
  }

  @Get('platforms')
  listPlatforms() {
    return this.library.listPlatforms();
  }
}
