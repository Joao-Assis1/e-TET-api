import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './feats/users/users.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  // 1. Criar Admin
  const adminUsername = 'admin';
  const existingAdmin = await usersService.findByUsername(adminUsername);

  if (!existingAdmin) {
    await usersService.create({
      usuario: adminUsername,
      senha: 'admin123',
    });
    console.log('✅ Usuário ADMIN criado: admin / admin123');
  }

  // 2. Criar ACS de Teste
  const acsUsername = 'acs_jose';
  const existingAcs = await usersService.findByUsername(acsUsername);

  if (!existingAcs) {
    await usersService.create({
      usuario: acsUsername,
      senha: 'acs123',
    });
    console.log('✅ Usuário ACS criado: acs_jose / acs123');
  } else {
    console.log('ℹ️ Os usuários de seed já existem.');
  }

  await app.close();
  console.log('\n🚀 Seed finalizado com sucesso!');
}

seed().catch((err) => {
  console.error('❌ Erro ao executar seed:', err);
  process.exit(1);
});
