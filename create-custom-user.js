const bcrypt = require('bcrypt');

async function createCustomUser(username, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Hardcoding Neon for now based on previous conversation
  require('dotenv').config();
  const { Client } = require('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  
  try {
    await client.connect();
    console.log('Conectado ao Neon PostgreSQL');
    
    await client.query(
      `INSERT INTO users (usuario, senha, role, cns_profissional, cnes_estabelecimento, ine_equipe)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (usuario) DO NOTHING`,
      [username, hashedPassword, 'profissional', '987654321098765', '1234567', '7654321098']
    );
    
    console.log(`✅ Usuário "${username}" criado no Neon PostgreSQL com sucesso.`);
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
  } finally {
    await client.end();
  }
}

createCustomUser('joaor', 'NovaSenhaSegura@2026').catch(console.error);
