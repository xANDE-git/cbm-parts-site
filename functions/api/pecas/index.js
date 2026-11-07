import { json, erro, exigirAdmin, lerJson, usuarioLogado } from '../../_lib/util.js';
import { SELECT_PECA, validarPeca, comandosAplicacoes } from '../../_lib/pecas.js';

const POR_PAGINA = 24;
const like = (s) => `%${s.replace(/[\\%_]/g, '\\$&')}%`;

// Versão pública: sem estoque exato nem peças desativadas.
export const paraPublico = (p) => {
  const { estoque, ativo, atualizado_em, ...resto } = p;
  return { ...resto, disponivel: estoque > 0 };
};

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const admin = url.searchParams.get('admin') === '1';
    if (admin) {
      const auth = await exigirAdmin(context);
      if (auth.resposta) return auth.resposta;
    }

    const where = [];
    const valores = [];
    if (!admin) where.push('p.ativo = 1');

    const q = url.searchParams.get('q')?.trim().slice(0, 80);
    if (q) {
      where.push(`(p.nome LIKE ? ESCAPE '\\' OR p.codigo LIKE ? ESCAPE '\\' OR p.descricao LIKE ? ESCAPE '\\')`);
      valores.push(like(q), like(q), like(q));
    }
    const categoria = Number(url.searchParams.get('categoria'));
    if (Number.isInteger(categoria) && categoria > 0) { where.push('p.categoria_id = ?'); valores.push(categoria); }
    const marca = Number(url.searchParams.get('marca'));
    if (Number.isInteger(marca) && marca > 0) { where.push('p.marca_id = ?'); valores.push(marca); }

    // Busca por carro: montadora, modelo e/ou ano.
    const montadora = url.searchParams.get('montadora')?.trim().slice(0, 60);
    const modelo = url.searchParams.get('modelo')?.trim().slice(0, 80);
    const ano = Number(url.searchParams.get('ano'));
    if (montadora || modelo || (Number.isInteger(ano) && ano > 0)) {
      let sub = 'EXISTS (SELECT 1 FROM aplicacoes a WHERE a.peca_id = p.id';
      if (montadora) { sub += ` AND a.montadora LIKE ? ESCAPE '\\'`; valores.push(like(montadora)); }
      if (modelo) { sub += ` AND a.modelo LIKE ? ESCAPE '\\'`; valores.push(like(modelo)); }
      if (Number.isInteger(ano) && ano > 0) {
        sub += ' AND (a.ano_inicial IS NULL OR a.ano_inicial <= ?) AND (a.ano_final IS NULL OR a.ano_final >= ?)';
        valores.push(ano, ano);
      }
      where.push(sub + ')');
    }

    if (url.searchParams.get('destaque') === '1') where.push('p.destaque = 1');
    if (url.searchParams.get('disponivel') === '1') where.push('p.estoque > 0');

    const filtro = where.length ? ` WHERE ${where.join(' AND ')}` : '';
    const pagina = Math.max(1, Number(url.searchParams.get('pagina')) || 1);

    const total = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM pecas p${filtro}`).bind(...valores).first()).n;
    const { results } = await env.DB.prepare(
      `${SELECT_PECA}${filtro} ORDER BY p.destaque DESC, p.nome COLLATE NOCASE LIMIT ? OFFSET ?`
    )
      .bind(...valores, POR_PAGINA, (pagina - 1) * POR_PAGINA)
      .all();

    return json({
      itens: admin ? results : results.map(paraPublico),
      total,
      pagina,
      porPagina: POR_PAGINA,
    });
  }

  if (request.method === 'POST') {
    const auth = await exigirAdmin(context);
    if (auth.resposta) return auth.resposta;

    const { erro: msg, dados } = validarPeca(await lerJson(request));
    if (msg) return erro(msg);

    try {
      const r = await env.DB.prepare(
        `INSERT INTO pecas (codigo, nome, descricao, preco_centavos, estoque, categoria_id, marca_id, imagem, ativo, destaque)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(dados.codigo, dados.nome, dados.descricao, dados.preco_centavos, dados.estoque, dados.categoria_id, dados.marca_id, dados.imagem, dados.ativo, dados.destaque)
        .run();
      const id = r.meta.last_row_id;
      await env.DB.batch(comandosAplicacoes(env, id, dados.aplicacoes));
      return json({ id }, 201);
    } catch (e) {
      if (String(e).includes('UNIQUE')) return erro('Já existe uma peça com esse código.', 409);
      return erro('Não foi possível salvar a peça.', 500);
    }
  }

  return erro('Método não permitido.', 405);
}
