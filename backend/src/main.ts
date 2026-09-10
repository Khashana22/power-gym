import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

let cachedServer: any;

async function bootstrapServer() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  // Serve uploads statically if local directory exists
  try {
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
      prefix: '/uploads',
    });
  } catch {
    // Ignore in serverless environments
  }

  // Permissive CORS for cloud & local
  app.enableCors({
    origin: (origin, callback) => {
      // Allow all origins (frontend on Vercel, localhost, mobile, etc.)
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  await app.init();
  return app.getHttpAdapter().getInstance();
}

// Serverless Handler for Vercel
export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  return cachedServer(req, res);
}

// Standalone server for local development or Docker
if (!process.env.VERCEL) {
  bootstrapServer().then((expressApp) => {
    const port = Number(process.env.PORT) || 3001;
    expressApp.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Power Gym API running on http://0.0.0.0:${port}`);
    });
  });
}