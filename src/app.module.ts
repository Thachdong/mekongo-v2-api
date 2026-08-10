import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  validationSchema,
  appConfig,
  databaseConfig,
  jwtConfig,
  throttleConfig,
  websocketConfig,
  otpConfig,
} from '@configs/index';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/infrastructure/security/jwt-auth.guard';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        throttleConfig,
        websocketConfig,
        otpConfig,
      ],
      validationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    AuthModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
