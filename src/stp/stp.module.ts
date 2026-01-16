import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { StpService } from './stp.service';
import { StpController } from './stp.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 30000, // 30 segundos de timeout
      maxRedirects: 5,
    }),
  ],
  controllers: [StpController],
  providers: [StpService],
  exports: [StpService],
})
export class StpModule {}

