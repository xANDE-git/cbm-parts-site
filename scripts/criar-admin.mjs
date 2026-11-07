// Cria (ou troca a senha de) um administrador.
// Uso:  node scripts/criar-admin.mjs email@exemplo.com "Nome" "senha-com-12-ou-mais-caracteres"
// Gera um arquivo .sql que você executa com o wrangler (o comando aparece no final).
// A senha NUNCA é guardada em texto: vai só o "hash" (um embaralhado que não volta ao original).
import { webcrypto } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';

const [email, nome, senha] = process.argv.slice(2);
if (!email || !nome || !senha) {
  console.error('Uso: node scripts/criar-admin.mjs <email> "<nome>" "<senha>"');
  process.exit(1);
}
if (senha.length < 12) {
  console.error('A senha precisa ter pelo menos 12 caracteres.');
  process.exit(1);
}

const ITERACOES = 100000; // limite do Cloudflare Workers
const b64 = (buf) => Buffer.from(buf).toString('base64');
const sal = webcrypto.getRandomValues(new Uint8Array(16));
const chave = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
const bits = await webcrypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: ITERACOES }, chave, 256);
const hash = `pbkdf2$${ITERACOES}$${b64(sal)}$${b64(bits)}`;

const esc = (s) => s.replace(/'/g, "''");
const sql = `INSERT INTO usuarios (email, nome, senha_hash) VALUES ('${esc(email.toLowerCase())}', '${esc(nome)}', '${hash}')
ON CONFLICT(email) DO UPDATE SET senha_hash = excluded.senha_hash, nome = excluded.nome;
DELETE FROM sessoes WHERE usuario_id = (SELECT id FROM usuarios WHERE email = '${esc(email.toLowerCase())}');
`;

mkdirSync('.tmp', { recursive: true });
writeFileSync('.tmp/admin.sql', sql);
console.log('Pronto. Agora rode (teste local):');
console.log('  npx wrangler d1 execute cbm-parts --local --file=.tmp/admin.sql');
console.log('Para o site no ar, troque --local por --remote. Depois apague a pasta .tmp.');
