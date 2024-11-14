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
  output: process.stdout,
});

async function connectDatabase() {
  try {
    await cliente.connect();
    console.log('Conectado ao banco de dados.');
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  }
}

async function listClientes() {
  const query = 'SELECT * FROM Cliente';
  try {
    const res = await cliente.query(query);
    console.log('Lista de Clientes:');
    res.rows.forEach((cliente) => {
      console.log(`ID: ${cliente.id}, Nome: ${cliente.nome}, Limite: ${cliente.limite}`);
    });
  } catch (err) {
    console.error('Erro ao listar clientes:', err);
  }
}

async function getClienteById(id) {
  const query = 'SELECT * FROM Cliente WHERE id = $1';
  const res = await cliente.query(query, [id]);
  return res.rows[0];
}

async function alterarLimite(id, novoLimite) {
  try {
    await cliente.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');
    const clienteAtual = await getClienteById(id);

    if (!clienteAtual) {
      console.log(`Cliente com ID ${id} não encontrado.`);
      await cliente.query('ROLLBACK');
      return;
    }

    const nomeAtual = clienteAtual.nome;
    const limiteAtual = clienteAtual.limite;

    console.log(`Cliente selecionado: ID ${id}, Nome: ${nomeAtual}, Limite: ${limiteAtual}`);

    const clienteAposSelect = await getClienteById(id);

    if (clienteAposSelect.nome === nomeAtual && clienteAposSelect.limite === limiteAtual) {
      const updateQuery = 'UPDATE Cliente SET limite = $1 WHERE id = $2';
      await cliente.query(updateQuery, [novoLimite, id]);

      rl.question('Deseja confirmar a atualização? 1-Sim 2-Não: ', async (resposta) => {
        if (resposta === '1') {
          try {
            await cliente.query('COMMIT');
            console.log('Update confirmado com sucesso!');
          } catch (err) {
            console.error('Erro ao confirmar transação:', err);
            await cliente.query('ROLLBACK');
          }
        } else {
          await cliente.query('ROLLBACK');
          console.log('Update cancelado com sucesso!');
        }
        rl.close();
      });
    } else {
      console.log('Os dados do cliente foram alterados por outro usuário. A operação foi cancelada.');
      await cliente.query('ROLLBACK');
    }
  } catch (err) {
    console.error('Erro ao realizar update do limite do cliente:', err);
    await cliente.query('ROLLBACK');
  }
}

async function runApp() {
  await connectDatabase();

  await listClientes();

  rl.question('Digite o ID do cliente que deseja alterar: ', async (id) => {
    rl.question('Qual o novo limite? R$ ', async (novoLimite) => {
      await alterarLimite(id, parseFloat(novoLimite));
    });
  });
}

runApp();
