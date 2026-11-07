// CRUD simples para tabelas "nome único" (categorias e marcas).
import { json, erro, exigirAdmin, lerJson, texto } from './util.js';

export function criarListagem(tabela, campoPeca) {
  return async function onRequest(context) {
    const { request, env } = context;

    if (request.method === 'GET') {
      const { results } = await env.DB.prepare(
        `SELECT t.id, t.nome,
           (SELECT COUNT(*) FROM pecas p WHERE p.${campoPeca} = t.id AND p.ativo = 1) AS total
         FROM ${tabela} t ORDER BY t.nome COLLATE NOCASE`
      ).all();
      return json(results, 200, { 'cache-control': 'public, max-age=60' });
    }

    if (request.method === 'POST') {
      const auth = await exigirAdmin(context);
      if (auth.resposta) return auth.resposta;
      const nome = texto((await lerJson(request))?.nome, 80);
      if (!nome) return erro('Informe o nome.');
      try {
        const r = await env.DB.prepare(`INSERT INTO ${tabela} (nome) VALUES (?)`).bind(nome).run();
        return json({ id: r.meta.last_row_id, nome }, 201);
      } catch {
        return erro('Já existe um item com esse nome.', 409);
      }
    }
    return erro('Método não permitido.', 405);
  };
}

export function criarItem(tabela) {
  return async function onRequest(context) {
    const { request, env, params } = context;
    const auth = await exigirAdmin(context);
    if (auth.resposta) return auth.resposta;
    const id = Number(params.id);
    if (!Number.isInteger(id)) return erro('Código inválido.');

    if (request.method === 'PUT') {
      const nome = texto((await lerJson(request))?.nome, 80);
      if (!nome) return erro('Informe o nome.');
      try {
        await env.DB.prepare(`UPDATE ${tabela} SET nome = ? WHERE id = ?`).bind(nome, id).run();
        return json({ id, nome });
      } catch {
        return erro('Já existe um item com esse nome.', 409);
      }
    }
    if (request.method === 'DELETE') {
      // As peças dessa categoria/marca não somem: ficam "sem categoria/marca".
      await env.DB.prepare(`DELETE FROM ${tabela} WHERE id = ?`).bind(id).run();
      return json({ ok: true });
    }
    return erro('Método não permitido.', 405);
  };
}
