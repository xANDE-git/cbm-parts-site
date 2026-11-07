import { $, esc, dinheiro, urlFoto, ehExemplo, api, iconeCategoria, revelar, escalonar, iniciarTopo } from './comum.js';

iniciarTopo();

const fVeiculo = $('#form-veiculo');
const fNome = $('#form-nome');
const estado = { categoria: 0, marca: 0, pagina: 1, soEstoque: false, categorias: [], marcas: [] };

// ---------- Endereço da página (para poder compartilhar uma busca) ----------
function lerUrl() {
  const p = new URLSearchParams(location.search);
  fVeiculo.elements.montadora.value = p.get('montadora') || '';
  fVeiculo.elements.modelo.value = p.get('modelo') || '';
  fVeiculo.elements.ano.value = p.get('ano') || '';
  fNome.elements.q.value = p.get('q') || '';
  estado.categoria = Number(p.get('categoria')) || 0;
  estado.marca = Number(p.get('marca')) || 0;
  estado.soEstoque = p.get('estoque') === '1';
  estado.pagina = Math.max(1, Number(p.get('pagina')) || 1);
  $('#so-estoque').checked = estado.soEstoque;
  if (p.get('q')) mudarModo('nome');
}

function parametros() {
  const p = new URLSearchParams();
  const campos = [['montadora', fVeiculo], ['modelo', fVeiculo], ['ano', fVeiculo], ['q', fNome]];
  for (const [nome, form] of campos) {
    const v = form.elements[nome].value.trim();
    if (v) p.set(nome, v);
  }
  if (estado.categoria) p.set('categoria', estado.categoria);
  if (estado.marca) p.set('marca', estado.marca);
  if (estado.soEstoque) p.set('estoque', '1');
  return p;
}

const temFiltro = () => [...parametros().keys()].length > 0;

function escreverUrl() {
  const p = parametros();
  if (estado.pagina > 1) p.set('pagina', estado.pagina);
  history.replaceState(null, '', p.toString() ? `/?${p}` : '/');
}

// ---------- Abas "Por veículo" / "Por código ou nome" ----------
function mudarModo(modo) {
  document.querySelectorAll('.abas-busca button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.modo === modo)));
  fVeiculo.hidden = modo !== 'veiculo';
  fNome.hidden = modo !== 'nome';
}
document.querySelector('.abas-busca').addEventListener('click', (e) => {
  const b = e.target.closest('[data-modo]');
  if (b) mudarModo(b.dataset.modo);
});

// ---------- Cartão de peça ----------
function cartao(p) {
  const foto = urlFoto(p.imagem);
  const preco = dinheiro(p.preco_centavos);
  return `<a class="cartao" href="/peca.html?id=${p.id}">
    <div class="foto">${foto ? `<img src="${foto}" alt="${esc(p.nome)}" loading="lazy">` : 'Sem foto'}${ehExemplo(p.imagem) ? '<span class="ilustra">Imagem ilustrativa</span>' : ''}</div>
    <div class="corpo">
      ${p.categoria ? `<span class="cat-nome">${esc(p.categoria)}</span>` : ''}
      <h3>${esc(p.nome)}</h3>
      <span class="cod">Cód. ${esc(p.codigo)}${p.marca ? ` · ${esc(p.marca)}` : ''}</span>
      <div class="rodape-cartao">
        <span class="preco${preco ? '' : ' consulte'}">${preco ? esc(preco) : 'Consulte'}</span>
        <span class="disp${p.disponivel ? ' ok' : ''}">${p.disponivel ? 'Em estoque' : 'Sob consulta'}</span>
      </div>
    </div>
  </a>`;
}

// ---------- Categorias (blocos grandes) e filtros laterais ----------
function desenharCategorias() {
  const caixa = $('#categorias');
  const lista = estado.categorias.filter((c) => c.total > 0);
  caixa.innerHTML = lista.map((c) => `<button type="button" class="cat rev" data-id="${c.id}" aria-pressed="${c.id === estado.categoria}">
      <span class="ico">${iconeCategoria(c.nome)}</span><strong>${esc(c.nome)}</strong><small>${c.total} ${c.total === 1 ? 'peça' : 'peças'}</small></button>`).join('');
  escalonar(caixa.children, 0.06);
  revelar(caixa);
}

function desenharFiltros() {
  const lista = (itens, atual, tipo) => [{ id: 0, nome: 'Todas', total: null }, ...itens.filter((i) => i.total > 0)]
    .map((i) => `<button type="button" class="filtro-item" data-tipo="${tipo}" data-id="${i.id}" aria-pressed="${i.id === atual}">${esc(i.id === 0 && tipo === 'marca' ? 'Todas as marcas' : i.id === 0 ? 'Todas as categorias' : i.nome)}${i.total != null ? `<small>${i.total}</small>` : ''}</button>`).join('');
  $('#filtro-categorias').innerHTML = lista(estado.categorias, estado.categoria, 'categoria');
  $('#filtro-marcas').innerHTML = lista(estado.marcas, estado.marca, 'marca');
}

function escolher(tipo, id) {
  estado[tipo] = id;
  estado.pagina = 1;
  desenharCategorias();
  desenharFiltros();
  buscar();
}

$('#categorias').addEventListener('click', (e) => {
  const b = e.target.closest('.cat');
  if (!b) return;
  const id = Number(b.dataset.id);
  escolher('categoria', estado.categoria === id ? 0 : id);
  $('#catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#filtros').addEventListener('click', (e) => {
  const b = e.target.closest('.filtro-item');
  if (b) escolher(b.dataset.tipo, Number(b.dataset.id));
});
$('#so-estoque').addEventListener('change', (e) => { estado.soEstoque = e.target.checked; estado.pagina = 1; buscar(); });
$('#limpar').addEventListener('click', () => {
  fVeiculo.reset(); fNome.reset();
  Object.assign(estado, { categoria: 0, marca: 0, pagina: 1, soEstoque: false });
  $('#so-estoque').checked = false;
  desenharCategorias(); desenharFiltros(); buscar();
});
$('#abrir-filtros').addEventListener('click', (e) => {
  const aberto = $('#filtros').classList.toggle('aberto');
  e.currentTarget.setAttribute('aria-expanded', String(aberto));
});

// ---------- Busca ----------
async function buscar() {
  escreverUrl();
  const grade = $('#grade');
  $('#contagem').textContent = 'Carregando...';
  const p = parametros();
  p.set('pagina', estado.pagina);
  if (p.get('estoque')) { p.delete('estoque'); p.set('disponivel', '1'); }
  try {
    const r = await api(`/api/pecas?${p}`);
    $('#contagem').textContent = r.total === 1 ? '1 peça' : `${r.total} peças`;
    $('#titulo-resultado').textContent = temFiltro() ? 'Resultado da busca' : 'Todas as peças';
    grade.innerHTML = r.itens.length
      ? r.itens.map(cartao).join('')
      : '<div class="vazio larga-grade">Nenhuma peça encontrada. Tente buscar por outro nome, código ou veículo, ou limpe os filtros.</div>';
    escalonar(grade.children);
    const paginas = Math.ceil(r.total / r.porPagina);
    $('#paginacao').innerHTML = paginas > 1
      ? `<button class="btn sec pequeno" ${r.pagina <= 1 ? 'disabled' : ''} data-ir="${r.pagina - 1}">Anterior</button>
         <span>Página ${r.pagina} de ${paginas}</span>
         <button class="btn sec pequeno" ${r.pagina >= paginas ? 'disabled' : ''} data-ir="${r.pagina + 1}">Próxima</button>`
      : '';
    $('#destaques-faixa').hidden = temFiltro() || !$('#destaques').children.length;
  } catch (e) {
    $('#contagem').textContent = '';
    grade.innerHTML = `<div class="vazio larga-grade">${esc(e.message)}</div>`;
  }
}

$('#paginacao').addEventListener('click', (e) => {
  const b = e.target.closest('[data-ir]');
  if (!b || b.disabled) return;
  estado.pagina = Number(b.dataset.ir);
  buscar();
  $('#catalogo').scrollIntoView({ behavior: 'smooth' });
});

for (const f of [fVeiculo, fNome]) {
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    // cada aba busca só pelo que está nela
    (f === fVeiculo ? fNome : fVeiculo).reset();
    estado.pagina = 1;
    buscar();
    $('#catalogo').scrollIntoView({ behavior: 'smooth' });
  });
}

// ---------- Início ----------
async function iniciar() {
  lerUrl();
  try {
    [estado.categorias, estado.marcas] = await Promise.all([api('/api/categorias'), api('/api/marcas')]);
  } catch { /* segue sem filtros */ }
  desenharCategorias();
  desenharFiltros();
  try {
    const d = await api('/api/pecas?destaque=1');
    $('#destaques').innerHTML = d.itens.slice(0, 4).map(cartao).join('');
    escalonar($('#destaques').children);
  } catch { /* sem destaques */ }
  await buscar();
  revelar();
}
iniciar();
