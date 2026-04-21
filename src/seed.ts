import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './feats/users/users.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  // 1. Criar Admin
  const adminCpf = '00000000000';
  const existingAdmin = await usersService.findByCpf(adminCpf);

  if (!existingAdmin) {
    await usersService.create({
      cpf: adminCpf,
      senha: 'admin123',
    });
    console.log('✅ Usuário ADMIN criado: 00000000000 / admin123');
  }

  // 2. Criar ACS de Teste
  const acsCpf = '12345678900';
  const existingAcs = await usersService.findByCpf(acsCpf);

  if (!existingAcs) {
    await usersService.create({
      cpf: acsCpf,
      senha: 'acs123',
    });
    console.log('✅ Usuário ACS criado: 12345678900 / acs123');
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
