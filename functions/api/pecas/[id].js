import { json, erro, exigirAdmin, lerJson, usuarioLogado } from '../../_lib/util.js';
import { SELECT_PECA, validarPeca, comandosAplicacoes } from '../../_lib/pecas.js';
import { paraPublico } from './index.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return erro('Código inválido.');

  if (request.method === 'GET') {
    const logado = !!(await usuarioLogado(context));
    const peca = await env.DB.prepare(`${SELECT_PECA} WHERE p.id = ?`).bind(id).first();
    if (!peca || (!peca.ativo && !logado)) return erro('Peça não encontrada.', 404);
    const { results } = await env.DB.prepare(
      'SELECT montadora, modelo, ano_inicial, ano_final, motor FROM aplicacoes WHERE peca_id = ? ORDER BY montadora, modelo, ano_inicial'
    )
      .bind(id)
      .all();
    return json({ ...(logado ? peca : paraPublico(peca)), aplicacoes: results });
  }

  const auth = await exigirAdmin(context);
  if (auth.resposta) return auth.resposta;

  if (request.method === 'PUT') {
    const { erro: msg, dados } = validarPeca(await lerJson(request));
    if (msg) return erro(msg);
    try {
      const r = await env.DB.prepare(
        `UPDATE pecas SET codigo=?, nome=?, descricao=?, preco_centavos=?, estoque=?, categoria_id=?, marca_id=?,
           imagem=?, ativo=?, destaque=?, atualizado_em=datetime('now') WHERE id=?`
      )
        .bind(dados.codigo, dados.nome, dados.descricao, dados.preco_centavos, dados.estoque, dados.categoria_id, dados.marca_id, dados.imagem, dados.ativo, dados.destaque, id)
        .run();
      if (!r.meta.changes) return erro('Peça não encontrada.', 404);
      await env.DB.batch(comandosAplicacoes(env, id, dados.aplicacoes));
      return json({ ok: true });
    } catch (e) {
      if (String(e).includes('UNIQUE')) return erro('Já existe outra peça com esse código.', 409);
      return erro('Não foi possível salvar a peça.', 500);
    }
  }

  if (request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM pecas WHERE id = ?').bind(id).run();
    return json({ ok: true });
  }

  return erro('Método não permitido.', 405);
}
