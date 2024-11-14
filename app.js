const { Client } = require('pg');
const readline = require('readline');

const cliente = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '0106',
  port: 5432,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function connectDatabase() {
  try {
    await cliente.connect();
    console.log('Conectado ao banco de dados.');
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  }
}

async function createCliente(nome, limite) {
  const query = `INSERT INTO Cliente(nome, limite) VALUES($1, $2) RETURNING *`;
  try {
    const res = await cliente.query(query, [nome, limite]);
    console.log('Cliente criado:', res.rows[0]);
  } catch (err) {
    console.error('Erro ao criar cliente:', err);
  }
}

async function listCliente() {
  const query = 'SELECT * FROM Cliente';
  try {
    const res = await cliente.query(query);
    console.log('Lista de Clientes:');
    res.rows.forEach(cliente => {
      console.log(`ID: ${cliente.id}, Nome: ${cliente.nome}, Limite: ${cliente.limite}`);
    });
  } catch (err) {
    console.error('Erro ao listar cliente:', err);
  }
}

async function alterarLimite(id, limite) {
  try {
    await cliente.query('BEGIN');
    const updateQuery = 'UPDATE Cliente SET limite = $1 WHERE id = $2';
    await cliente.query(updateQuery, [limite, id]);
    console.log('Limite atualizado!');

    rl.question('Deseja confirmar ação? 1-Sim 2-Não: ', async (resposta) => {
      if (resposta === '1') {
        await cliente.query('COMMIT');
        console.log('Update confirmado com sucesso!');
      } else {
        await cliente.query('ROLLBACK');
        console.log('Update desfeito com sucesso!');
      }
      rl.close();
    });
  } catch (err) {
    console.error('Erro ao realizar update do limite do cliente:', err);
    await cliente.query('ROLLBACK');
  }
}

async function runApp() {
  await connectDatabase();

  await createCliente('Victor', 200.00);
  await createCliente('Leandro', 250.00);

  await listCliente();

  rl.question('Deseja alterar o limite de qual usuário? Digite o ID correspondente ao cliente: ', (id) => {
    rl.question('Qual o novo limite? R$ ', async (limite) => {
      await alterarLimite(id, parseFloat(limite));
    });
  });
}

runApp();
