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
  firebaseConfig,
} from '@configs/index';
import { AuthModule } from './modules/auth/auth.module';
import { AccountModule } from './modules/account/account.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ReferenceDataModule } from './modules/reference-data/reference-data.module';
import { AddressModule } from './modules/address/address.module';
import { UploadModule } from './modules/upload/upload.module';
import { JwtAuthGuard } from './modules/auth/infrastructure/security/jwt-auth.guard';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { FirebaseModule } from '@shared/infrastructure/firebase/firebase.module';

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
        firebaseConfig,
      ],
      validationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    AccountModule,
    ProfileModule,
    ReferenceDataModule,
    AddressModule,
    UploadModule,
    AuthModule,
    PrismaModule,
    FirebaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
