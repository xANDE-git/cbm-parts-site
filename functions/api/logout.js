import { json, erro, lerCookie, sha256Hex, cookieSessao, NOME_COOKIE, naoMetodo } from '../_lib/util.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return naoMetodo();
  const origem = request.headers.get('origin');
  if (!origem || new URL(origem).host !== new URL(request.url).host) return erro('Origem não permitida.', 403);

  const token = lerCookie(request, NOME_COOKIE);
  if (token && /^[0-9a-f]{64}$/.test(token)) {
    await env.DB.prepare('DELETE FROM sessoes WHERE token_hash = ?').bind(await sha256Hex(token)).run();
  }
  return json({ ok: true }, 200, { 'set-cookie': cookieSessao('', request, 0) });
}
