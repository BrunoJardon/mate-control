import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPrismaClient } from '@mate-control/database';
import { PRISMA_CLIENT } from './prisma.constants.js';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [
    {
      provide: PRISMA_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createPrismaClient(config.getOrThrow<string>('DATABASE_URL')),
    },
    PrismaService,
  ],
  exports: [PRISMA_CLIENT, PrismaService],
})
export class PrismaModule {}
