import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { LibraryModule } from './library/library.module';
import { ScannerModule } from './scanner/scanner.module';
import { FsModule } from './fs/fs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    LibraryModule,
    ScannerModule,
    FsModule,
  ],
})
export class AppModule {}
