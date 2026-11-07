import { $, esc, dinheiro, urlFoto, anos, api } from './comum.js';

const id = Number(new URLSearchParams(location.search).get('id'));
const caixa = $('#conteudo');

try {
  if (!Number.isInteger(id) || id < 1) throw new Error('Peça não encontrada.');
  const p = await api(`/api/pecas/${id}`);
  document.title = `${p.nome} | CBM Parts`;
  const foto = urlFoto(p.imagem);
  const preco = dinheiro(p.preco_centavos);
  caixa.innerHTML = `<article class="peca">
    <div class="foto-grande">${foto ? `<img src="${foto}" alt="${esc(p.nome)}">` : 'Sem foto'}</div>
    <div>
      <span class="cod">Cód. ${esc(p.codigo)}</span>
      <h1>${esc(p.nome)}</h1>
      <span class="selo ${p.disponivel ? 'ok' : 'sem'}">${p.disponivel ? 'Em estoque' : 'Sob consulta'}</span>
      <p class="preco">${preco ? esc(preco) : 'Consulte o preço'}</p>
      <dl>
        ${p.marca ? `<dt>Marca</dt><dd>${esc(p.marca)}</dd>` : ''}
        ${p.categoria ? `<dt>Categoria</dt><dd>${esc(p.categoria)}</dd>` : ''}
      </dl>
      ${p.descricao ? `<p>${esc(p.descricao).replace(/\n/g, '<br>')}</p>` : ''}
      ${p.aplicacoes.length ? `<h2 class="sub-titulo">Serve nestes carros</h2>
        <div class="rolagem-x"><table class="tabela">
          <thead><tr><th>Montadora</th><th>Modelo</th><th>Ano</th><th>Motor</th></tr></thead>
          <tbody>${p.aplicacoes.map((a) => `<tr><td>${esc(a.montadora)}</td><td>${esc(a.modelo)}</td><td>${esc(anos(a))}</td><td>${esc(a.motor || '-')}</td></tr>`).join('')}</tbody>
        </table></div>` : ''}
    </div>
  </article>`;
} catch (e) {
  caixa.innerHTML = `<div class="vazio">${esc(e.message)}</div>`;
}
