// Regras compartilhadas entre listar, criar e editar peças.
import { texto, paraCentavos } from './util.js';

export const SELECT_PECA = `
  SELECT p.id, p.codigo, p.nome, p.descricao, p.preco_centavos, p.estoque, p.imagem, p.ativo, p.destaque,
         p.categoria_id, c.nome AS categoria, p.marca_id, m.nome AS marca, p.atualizado_em
  FROM pecas p
  LEFT JOIN categorias c ON c.id = p.categoria_id
  LEFT JOIN marcas m ON m.id = p.marca_id`;

// Valida o que veio do painel. Devolve { erro } ou { dados }.
export function validarPeca(corpo) {
  if (!corpo || typeof corpo !== 'object') return { erro: 'Dados inválidos.' };

  const codigo = texto(corpo.codigo, 60);
  const nome = texto(corpo.nome, 150);
  if (!codigo) return { erro: 'Informe o código da peça.' };
  if (!nome) return { erro: 'Informe o nome da peça.' };

  const preco = paraCentavos(corpo.preco);
  if (preco === undefined) return { erro: 'Preço inválido.' };

  const estoque = Number(corpo.estoque ?? 0);
  if (!Number.isInteger(estoque) || estoque < 0 || estoque > 1000000) return { erro: 'Estoque inválido.' };

  const idOuNulo = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
  const categoria_id = idOuNulo(corpo.categoria_id);
  const marca_id = idOuNulo(corpo.marca_id);
  if ([categoria_id, marca_id].some((v) => v !== null && !Number.isInteger(v))) return { erro: 'Categoria ou marca inválida.' };

  const imagem = corpo.imagem ? texto(corpo.imagem, 100) : null;
  if (imagem && !/^[a-z0-9-]+\.(jpg|png|webp)$/.test(imagem)) return { erro: 'Imagem inválida.' };

  const aplicacoes = [];
  for (const a of Array.isArray(corpo.aplicacoes) ? corpo.aplicacoes.slice(0, 200) : []) {
    const montadora = texto(a?.montadora, 60);
    const modelo = texto(a?.modelo, 80);
    if (!montadora && !modelo) continue; // linha vazia: ignora
    if (!montadora || !modelo) return { erro: 'Em cada carro, preencha montadora e modelo.' };
    const ano = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
    const ano_inicial = ano(a.ano_inicial);
    const ano_final = ano(a.ano_final);
    for (const y of [ano_inicial, ano_final]) {
      if (y !== null && (!Number.isInteger(y) || y < 1950 || y > 2100)) return { erro: 'Ano inválido nos carros compatíveis.' };
    }
    if (ano_inicial !== null && ano_final !== null && ano_inicial > ano_final) return { erro: 'O ano inicial não pode ser maior que o final.' };
    aplicacoes.push({ montadora, modelo, ano_inicial, ano_final, motor: texto(a.motor, 40) });
  }

  return {
    dados: {
      codigo,
      nome,
      descricao: texto(corpo.descricao, 4000),
      preco_centavos: preco,
      estoque,
      categoria_id,
      marca_id,
      imagem,
      ativo: corpo.ativo === false || corpo.ativo === 0 ? 0 : 1,
      destaque: corpo.destaque ? 1 : 0,
      aplicacoes,
    },
  };
}

export function comandosAplicacoes(env, pecaId, aplicacoes) {
  return [
    env.DB.prepare('DELETE FROM aplicacoes WHERE peca_id = ?').bind(pecaId),
    ...aplicacoes.map((a) =>
      env.DB.prepare(
        'INSERT INTO aplicacoes (peca_id, montadora, modelo, ano_inicial, ano_final, motor) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(pecaId, a.montadora, a.modelo, a.ano_inicial, a.ano_final, a.motor)
    ),
  ];
}
