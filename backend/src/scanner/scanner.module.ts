import { Module } from '@nestjs/common';
import { ScannerRunner } from './scanner.runner';
import { FilesystemAdapter } from './infra/filesystem.adapter';

@Module({
  providers: [ScannerRunner, FilesystemAdapter],
  exports: [ScannerRunner],
})
export class ScannerModule {}
