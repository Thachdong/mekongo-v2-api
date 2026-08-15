import { TAdminConfig } from '@configs/index';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export const FIREBASE_ADMIN = Symbol('FIREBASE_ADMIN');

export const firebaseAdminProvider = {
  provide: FIREBASE_ADMIN,
  useFactory: (config: ConfigService) => {
    const cfg = config.get<TAdminConfig>('firebase');
    const isAdminInitialized = admin.getApps()?.length > 0;

    if (isAdminInitialized) {
      return admin.getApp();
    } else {
      return admin.initializeApp({
        credential: admin.cert({
          projectId: cfg.projectId,
          clientEmail: cfg.clientEmail,
          privateKey: cfg.privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket: cfg.storageBucket,
      });
    }
  },
  inject: [ConfigService],
};
