import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { networkInterfaces } from 'os';
import { AppModule } from './app.module';

/** Detect the current LAN IPv4 (Wi-Fi / Ethernet). Falls back to 'localhost'. */
function getLanIp(): string {
  const nets = networkInterfaces();
  for (const ifaces of Object.values(nets)) {
    for (const iface of ifaces ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const ip = iface.address;
        // Accept any private-range IP
        if (
          ip.startsWith('192.168.') ||
          ip.startsWith('10.') ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
        ) {
          return ip;
        }
      }
    }
  }
  return 'localhost';
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers
  app.use(helmet());

  // Serve uploaded member photos statically
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // Dynamic CORS — accepts localhost, 127.0.0.1 and any private-network IP.
  // No hardcoded IPs; works on any WiFi network automatically.
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, server-side Next.js)
      if (!origin) return callback(null, true);

      // Localhost variants
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      // Any private-network IP on any port
      if (
        /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3001;
  const lanIp = getLanIp();

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Power Gym API running on http://0.0.0.0:${port}`);
  console.log(`   → Local:   http://localhost:${port}`);
  console.log(`   → Network: http://${lanIp}:${port}`);
}
bootstrap();