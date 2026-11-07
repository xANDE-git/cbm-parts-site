import { json, exigirAdmin } from '../_lib/util.js';

// Números do topo do painel. "Estoque baixo" = de 1 a 4 unidades (igual ao painel).
export async function onRequestGet(context) {
  const auth = await exigirAdmin(context);
  if (auth.resposta) return auth.resposta;
  const r = await context.env.DB.prepare(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN estoque BETWEEN 1 AND 4 THEN 1 ELSE 0 END), 0) AS baixo,
            COALESCE(SUM(CASE WHEN estoque = 0 THEN 1 ELSE 0 END), 0) AS zerado,
            COALESCE(SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END), 0) AS ocultas
     FROM pecas`
  ).first();
  return json(r);
}
