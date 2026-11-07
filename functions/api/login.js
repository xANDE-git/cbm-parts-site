import { json, erro, lerJson, texto, conferirSenha, sha256Hex, cookieSessao, DURACAO_SESSAO_HORAS, naoMetodo } from '../_lib/util.js';

const MAX_TENTATIVAS = 5; // por IP, a cada 15 minutos

// Hash "de mentira" só para gastar o mesmo tempo quando o e-mail não existe.
const HASH_FALSO = `pbkdf2$100000$${'A'.repeat(22)}==$${'A'.repeat(43)}=`;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return naoMetodo();

  const origem = request.headers.get('origin');
  if (!origem || new URL(origem).host !== new URL(request.url).host) return erro('Origem não permitida.', 403);

  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const { results } = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM tentativas_login WHERE ip = ? AND criado_em > datetime('now', '-15 minutes')`
  )
    .bind(ip)
    .all();
  if (results[0].n >= MAX_TENTATIVAS) return erro('Muitas tentativas. Espere 15 minutos e tente de novo.', 429);

  const corpo = await lerJson(request);
  const email = texto(corpo?.email, 200).toLowerCase();
  const senha = typeof corpo?.senha === 'string' ? corpo.senha.slice(0, 200) : '';

  const usuario = await env.DB.prepare('SELECT id, nome, senha_hash FROM usuarios WHERE email = ?').bind(email).first();
  const ok = await conferirSenha(senha, usuario ? usuario.senha_hash : HASH_FALSO);

  if (!usuario || !ok) {
    await env.DB.prepare('INSERT INTO tentativas_login (ip) VALUES (?)').bind(ip).run();
    return erro('E-mail ou senha incorretos.', 401);
  }

  // Login certo: limpa tentativas, apaga sessões vencidas e cria uma nova.
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM tentativas_login WHERE ip = ?').bind(ip),
    env.DB.prepare(`DELETE FROM sessoes WHERE expira_em <= datetime('now')`),
    env.DB.prepare(`INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES (?, ?, datetime('now', ?))`).bind(
      await sha256Hex(token),
      usuario.id,
      `+${DURACAO_SESSAO_HORAS} hours`
    ),
  ]);

  return json({ ok: true, nome: usuario.nome }, 200, {
    'set-cookie': cookieSessao(token, request, DURACAO_SESSAO_HORAS * 3600),
  });
}
