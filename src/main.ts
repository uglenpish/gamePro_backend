import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');

async function bootstrap(): Promise<void> {
  try {
    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.enableCors();
    await app.listen(process.env.PORT ?? 3000);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
bootstrap();
