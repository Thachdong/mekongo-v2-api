import { registerAs } from '@nestjs/config';

export default registerAs('websocket', () => ({
  port: parseInt(process.env.WS_PORT ?? '3001', 10),
  namespace: process.env.WS_NAMESPACE ?? '/',
  corsOrigin: process.env.WS_CORS_ORIGIN ?? '*',
}));
