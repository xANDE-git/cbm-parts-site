import { $, esc, dinheiro, urlFoto, api } from './comum.js';

const form = $('#form-busca');
const estado = { categoria: 0, pagina: 1 };

function lerUrl() {
  const p = new URLSearchParams(location.search);
  for (const campo of ['q', 'montadora', 'modelo', 'ano']) form.elements[campo].value = p.get(campo) || '';
  estado.categoria = Number(p.get('categoria')) || 0;
  estado.pagina = Math.max(1, Number(p.get('pagina')) || 1);
}

function escreverUrl() {
  const p = new URLSearchParams();
  for (const campo of ['q', 'montadora', 'modelo', 'ano']) if (form.elements[campo].value.trim()) p.set(campo, form.elements[campo].value.trim());
  if (estado.categoria) p.set('categoria', estado.categoria);
  if (estado.pagina > 1) p.set('pagina', estado.pagina);
  history.replaceState(null, '', p.toString() ? `/?${p}` : '/');
  return p;
}

function cartao(p) {
  const foto = urlFoto(p.imagem);
  const preco = dinheiro(p.preco_centavos);
  return `<a class="cartao" href="/peca.html?id=${p.id}">
    <div class="foto">${foto ? `<img src="${foto}" alt="${esc(p.nome)}" loading="lazy">` : 'Sem foto'}</div>
    <div class="corpo">
      <span class="cod">Cód. ${esc(p.codigo)}</span>
      <h3>${esc(p.nome)}</h3>
      <span class="meta">${esc([p.marca, p.categoria].filter(Boolean).join(' · '))}</span>
      <span class="preco">${preco ? esc(preco) : 'Consulte'}</span>
      <span class="selo ${p.disponivel ? 'ok' : 'sem'}">${p.disponivel ? 'Em estoque' : 'Sob consulta'}</span>
    </div>
  </a>`;
}

async function carregarCategorias() {
  const cats = await api('/api/categorias');
  const caixa = $('#chips');
  const itens = [{ id: 0, nome: 'Todas' }, ...cats.filter((c) => c.total > 0)];
  caixa.innerHTML = itens.map((c) => `<button type="button" class="chip" data-id="${c.id}" aria-pressed="${c.id === estado.categoria}">${esc(c.nome)}</button>`).join('');
  caixa.onclick = (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    estado.categoria = Number(b.dataset.id);
    estado.pagina = 1;
    carregarCategorias();
    buscar();
  };
}

async function buscar() {
  const p = escreverUrl();
  const grade = $('#grade');
  grade.innerHTML = '';
  $('#contagem').textContent = 'Carregando...';
  try {
    const r = await api(`/api/pecas?${p}`);
    $('#contagem').textContent = r.total === 1 ? '1 peça' : `${r.total} peças`;
    grade.innerHTML = r.itens.length
      ? r.itens.map(cartao).join('')
      : '<div class="vazio larga-grade">Nenhuma peça encontrada. Tente buscar por outro nome, código ou carro.</div>';
    const paginas = Math.ceil(r.total / r.porPagina);
    $('#paginacao').innerHTML = paginas > 1
      ? `<button class="btn sec pequeno" ${r.pagina <= 1 ? 'disabled' : ''} data-ir="${r.pagina - 1}">Anterior</button>
         <span>Página ${r.pagina} de ${paginas}</span>
         <button class="btn sec pequeno" ${r.pagina >= paginas ? 'disabled' : ''} data-ir="${r.pagina + 1}">Próxima</button>`
      : '';
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
  scrollTo({ top: 0, behavior: 'smooth' });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  estado.pagina = 1;
  buscar();
});

lerUrl();
carregarCategorias();
buscar();
