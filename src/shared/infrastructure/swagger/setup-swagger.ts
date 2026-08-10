import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const TAGS = [
  'Auth',
  'Account',
  'Profile',
  'Reference Data',
  'Uploads',
  'Posts',
  'Comments',
  'Chat',
  'Notifications',
  'Friends',
  'Reports',
  'TrustScore',
] as const;

export function setupSwagger(app: INestApplication): void {
  const configBuilder = new DocumentBuilder()
    .setTitle('MEKONGO API')
    .setVersion('0.2.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearerAuth',
    );

  TAGS.forEach((tag) => configBuilder.addTag(tag));

  const document = SwaggerModule.createDocument(app, configBuilder.build());
  SwaggerModule.setup('docs', app, document);
}
