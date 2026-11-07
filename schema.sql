-- Estrutura do banco de dados da CBM Parts.
-- Pode rodar mais de uma vez: só cria o que ainda não existe.

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Guardamos só o "resumo" (hash) do token de login, nunca o token em si.
CREATE TABLE IF NOT EXISTS sessoes (
  token_hash TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_em TEXT NOT NULL
);

-- Para barrar quem fica chutando senha.
CREATE TABLE IF NOT EXISTS tentativas_login (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS marcas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE
);

-- Preço em centavos (R$ 12,90 vira 1290). Vazio = "consulte".
CREATE TABLE IF NOT EXISTS pecas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  preco_centavos INTEGER,
  estoque INTEGER NOT NULL DEFAULT 0,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  marca_id INTEGER REFERENCES marcas(id) ON DELETE SET NULL,
  imagem TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  destaque INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Em quais carros a peça serve (ex.: Fiat / Uno / 2010 a 2016 / 1.0).
CREATE TABLE IF NOT EXISTS aplicacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  peca_id INTEGER NOT NULL REFERENCES pecas(id) ON DELETE CASCADE,
  montadora TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano_inicial INTEGER,
  ano_final INTEGER,
  motor TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_pecas_categoria ON pecas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_pecas_marca ON pecas(marca_id);
CREATE INDEX IF NOT EXISTS idx_aplicacoes_peca ON aplicacoes(peca_id);
CREATE INDEX IF NOT EXISTS idx_aplicacoes_modelo ON aplicacoes(modelo);
CREATE INDEX IF NOT EXISTS idx_tentativas_ip ON tentativas_login(ip, criado_em);
