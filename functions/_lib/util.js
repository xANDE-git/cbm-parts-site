// Funções de apoio usadas por todas as rotas da API.

export const json = (dados, status = 200, extra = {}) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });

export const erro = (mensagem, status = 400) => json({ erro: mensagem }, status);

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function sha256Hex(texto) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Compara o hash guardado com a senha digitada (formato: pbkdf2$iteracoes$sal$hash).
export async function conferirSenha(senha, guardado) {
  const [tipo, iter, sal, hash] = guardado.split('$');
  if (tipo !== 'pbkdf2') return false;
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: deB64(sal), iterations: Number(iter) },
    chave,
    256
  );
  const a = new Uint8Array(bits);
  const b = deB64(hash);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]; // tempo constante
  return diff === 0;
}

export function lerCookie(request, nome) {
  const cookie = request.headers.get('cookie') || '';
  for (const parte of cookie.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nome) return v.join('=');
  }
  return null;
}

export const NOME_COOKIE = 'cbm_sessao';
export const DURACAO_SESSAO_HORAS = 12;

// Devolve o usuário logado ou null.
export async function usuarioLogado(context) {
  const token = lerCookie(context.request, NOME_COOKIE);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const hash = await sha256Hex(token);
  return await context.env.DB.prepare(
    `SELECT u.id, u.email, u.nome FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.token_hash = ? AND s.expira_em > datetime('now')`
  )
    .bind(hash)
    .first();
}

// Protege as rotas do painel: precisa estar logado e (nas alterações) vir do próprio site.
export async function exigirAdmin(context) {
  const { request } = context;
  const metodo = request.method;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(metodo)) {
    const origem = request.headers.get('origin');
    if (!origem || new URL(origem).host !== new URL(request.url).host) {
      return { resposta: erro('Origem não permitida.', 403) };
    }
  }
  const usuario = await usuarioLogado(context);
  if (!usuario) return { resposta: erro('Faça login para continuar.', 401) };
  return { usuario };
}

export async function lerJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export const texto = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Aceita "12,90" ou "12.90" ou número e devolve centavos (ou null se vazio).
export function paraCentavos(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 10000000) return undefined; // undefined = inválido
  return Math.round(n * 100);
}

export const naoMetodo = () => erro('Método não permitido.', 405);

export function cookieSessao(token, request, maxAge) {
  const seguro = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${NOME_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/${seguro}; Max-Age=${maxAge}`;
}

export { b64 };
