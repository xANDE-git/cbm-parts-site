import { $, esc, dinheiro, urlFoto, ehExemplo, anos, api, iniciarTopo, revelar } from './comum.js';
import { WHATSAPP } from './config.js';

iniciarTopo();

const id = Number(new URLSearchParams(location.search).get('id'));
const caixa = $('#conteudo');

try {
  if (!Number.isInteger(id) || id < 1) throw new Error('Peça não encontrada.');
  const p = await api(`/api/pecas/${id}`);
  document.title = `${p.nome} | CBM Parts`;
  const foto = urlFoto(p.imagem);
  const preco = dinheiro(p.preco_centavos);
  const msg = encodeURIComponent(`Olá! Gostaria de um orçamento da peça ${p.nome} (código ${p.codigo}).`);
  const zap = WHATSAPP ? `<a class="btn ouro grande" href="https://wa.me/${esc(WHATSAPP)}?text=${msg}" target="_blank" rel="noopener">Pedir orçamento</a>` : '';

  caixa.innerHTML = `
    <nav class="migalhas" aria-label="Você está em">
      <a href="/">Início</a><span>›</span><a href="/#catalogo">Catálogo</a>${p.categoria ? `<span>›</span><span>${esc(p.categoria)}</span>` : ''}
    </nav>
    <article class="peca">
      <div class="foto-grande">${foto ? `<img src="${foto}" alt="${esc(p.nome)}">` : 'Sem foto'}${ehExemplo(p.imagem) ? '<span class="ilustra">Imagem ilustrativa</span>' : ''}</div>
      <div class="info">
        ${p.categoria ? `<span class="kicker">${esc(p.categoria)}</span>` : ''}
        <h1 class="display">${esc(p.nome)}</h1>
        <div class="chips-info">
          <span class="chip-info">Cód. ${esc(p.codigo)}</span>
          ${p.marca ? `<span class="chip-info">${esc(p.marca)}</span>` : ''}
          <span class="selo ${p.disponivel ? 'ok' : 'sem'}">${p.disponivel ? 'Em estoque' : 'Sob consulta'}</span>
        </div>
        <p class="preco${preco ? '' : ' consulte'}">${preco ? esc(preco) : 'Consulte o preço'}</p>
        ${p.descricao ? `<p>${esc(p.descricao).replace(/\n/g, '<br>')}</p>` : ''}
        <dl>
          <dt>Código</dt><dd>${esc(p.codigo)}</dd>
          ${p.marca ? `<dt>Marca</dt><dd>${esc(p.marca)}</dd>` : ''}
          ${p.categoria ? `<dt>Categoria</dt><dd>${esc(p.categoria)}</dd>` : ''}
          <dt>Disponibilidade</dt><dd>${p.disponivel ? 'Em estoque' : 'Consulte a loja'}</dd>
        </dl>
        <div class="acoes-peca">${zap}<a class="btn sec" href="/#catalogo">← Voltar ao catálogo</a></div>
      </div>
    </article>
    ${p.aplicacoes.length ? `<section class="secao-compat rev">
      <span class="kicker">Compatibilidade</span>
      <h2 class="display">Serve nestes veículos</h2>
      <div class="rolagem-x"><table class="tabela">
        <thead><tr><th>Montadora</th><th>Modelo</th><th>Ano</th><th>Motor</th></tr></thead>
        <tbody>${p.aplicacoes.map((a) => `<tr><td>${esc(a.montadora)}</td><td>${esc(a.modelo)}</td><td>${esc(anos(a))}</td><td>${esc(a.motor || '-')}</td></tr>`).join('')}</tbody>
      </table></div>
    </section>` : ''}`;
  revelar();
} catch (e) {
  caixa.innerHTML = `<div class="vazio">${esc(e.message)} <br><br><a class="btn" href="/">Voltar ao catálogo</a></div>`;
}
