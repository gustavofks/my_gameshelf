import { Module } from '@nestjs/common';
import { ScannerController } from './scanner.controller';
import { ScannerService } from './scanner.service';
import { ScannerRunner } from './scanner.runner';
import { FilesystemAdapter } from './infra/filesystem.adapter';

@Module({
  controllers: [ScannerController],
  providers: [ScannerService, ScannerRunner, FilesystemAdapter],
  exports: [ScannerRunner],
})
export class ScannerModule {}
