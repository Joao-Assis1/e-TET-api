import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './feats/users/users.service';
import { UserRole } from './feats/users/user.entity';

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
      role: UserRole.ADMIN,
      cns: '000000000000000',
      cne: '0000000',
    });
    console.log('✅ Usuário ADMIN criado: admin / admin123');
  }

  // 2. Criar ACS de Teste (Profissional)
  const acsUsername = 'acs_jose';
  const existingAcs = await usersService.findByUsername(acsUsername);

  if (!existingAcs) {
    await usersService.create({
      usuario: acsUsername,
      senha: 'acs123',
      role: UserRole.PROFISSIONAL,
      cns: '209384756100005', // CNS Fictício Válido (Formato)
      cne: '7654321', // CNE da Unidade de Saúde
    });
    console.log(
      '✅ Usuário ACS criado: acs_jose / acs123 (CNS: 209384756100005)',
    );
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
