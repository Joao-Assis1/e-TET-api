import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DatabaseInterceptor } from './common/interceptors/database.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalInterceptors(new DatabaseInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('e-TET API')
    .setDescription(
      'API para Gestão de Território, Famílias e Estratificação de Risco na APS',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 API rodando em: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📄 Swagger: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
bootstrap().catch((err) => {
  console.error('❌ Erro inesperado ao iniciar a aplicação:', err);
  process.exit(1);
});
