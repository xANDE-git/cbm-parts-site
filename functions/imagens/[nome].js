// Entrega as fotos guardadas no R2. O nome é um código aleatório, então não dá para "adivinhar" fotos.
export async function onRequestGet({ env, params }) {
  const nome = String(params.nome);
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(nome)) return new Response('Não encontrado', { status: 404 });
  if (!env.FOTOS) return new Response('Não encontrado', { status: 404 });
  const obj = await env.FOTOS.get(nome);
  if (!obj) return new Response('Não encontrado', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType || 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
}
