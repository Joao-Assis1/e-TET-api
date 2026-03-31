import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Family } from './feats/families/family.entity';
import { Individual } from './feats/individuals/individual.entity';
import { User } from './feats/users/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // O DataSource padrão é o SQLite. O nomeado é o Postgres.
  const sqliteDs: DataSource = app.get(getDataSourceToken());
  const pgDs: DataSource = app.get(getDataSourceToken('postgres'));

  console.log('--- Lendo dados do SQLite ---');
  const users = await sqliteDs.getRepository(User).find();
  const families = await sqliteDs.getRepository(Family).find();
  const individuals = await sqliteDs
    .getRepository(Individual)
    .find({ relations: ['family'] });

  console.log(
    `Encontrados: ${users.length} Usuários, ${families.length} Famílias, ${individuals.length} Indivíduos.`,
  );

  console.log('--- Inserindo/Atualizando no PostgreSQL ---');

  if (users.length > 0) {
    await pgDs.getRepository(User).save(users);
    console.log('Usuários copiados!');
  }

  if (families.length > 0) {
    await pgDs.getRepository(Family).save(families);
    console.log('Famílias copiadas!');
  }

  if (individuals.length > 0) {
    await pgDs.getRepository(Individual).save(individuals);
    console.log('Indivíduos copiados!');
  }

  console.log('--- Sincronização Concluída ---');
  await app.close();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
