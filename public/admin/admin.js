import { $, esc, dinheiro, urlFoto, api } from '/comum.js';

const ESTOQUE_BAIXO = 5; // abaixo disso a quantidade fica em laranja
const estado = { pagina: 1, q: '', categorias: [], marcas: [], imagem: null, editando: null };

function aviso(msg, erro = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = `toast visivel${erro ? ' erro' : ''}`;
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => (t.className = 'toast'), 3200);
}

// ---------- Login / sessão ----------
async function iniciar() {
  try {
    await api('/api/me');
    mostrarPainel();
  } catch {
    $('#tela-login').hidden = false;
    $('#tela-painel').hidden = true;
    $('#nav-topo').hidden = true;
  }
}

$('#form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#erro-login').textContent = '';
  const f = e.target.elements;
  try {
    await api('/api/login', { method: 'POST', corpo: { email: f.email.value, senha: f.senha.value } });
    f.senha.value = '';
    $('#tela-login').hidden = true;
    mostrarPainel();
  } catch (err) {
    $('#erro-login').textContent = err.message;
  }
});

$('#sair').addEventListener('click', async (e) => {
  e.preventDefault();
  try { await api('/api/logout', { method: 'POST' }); } catch { /* segue */ }
  location.reload();
});

// Se a sessão vencer no meio do uso, volta para o login.
function tratar(err) {
  if (err.status === 401) { aviso('Sua sessão terminou. Entre de novo.', true); setTimeout(() => location.reload(), 1200); return; }
  aviso(err.message, true);
}

async function mostrarPainel() {
  $('#tela-login').hidden = true;
  $('#tela-painel').hidden = false;
  $('#nav-topo').hidden = false;
  await carregarListas();
  carregarPecas();
}

async function carregarListas() {
  [estado.categorias, estado.marcas] = await Promise.all([api('/api/categorias'), api('/api/marcas')]);
}

// ---------- Abas ----------
document.querySelector('.abas').addEventListener('click', (e) => {
  const b = e.target.closest('[data-aba]');
  if (!b) return;
  document.querySelectorAll('.abas button').forEach((x) => x.setAttribute('aria-selected', x === b));
  for (const nome of ['pecas', 'categorias', 'marcas']) $(`#aba-${nome}`).hidden = nome !== b.dataset.aba;
  if (b.dataset.aba !== 'pecas') desenharLista(b.dataset.aba);
});

// ---------- Lista de peças ----------
async function carregarResumo() {
  try {
    const r = await api('/api/resumo');
    $('#resumo').innerHTML = `
      <div class="num"><strong>${r.total}</strong><span>Peças cadastradas</span></div>
      <div class="num aviso"><strong>${r.baixo}</strong><span>Estoque baixo</span></div>
      <div class="num alerta"><strong>${r.zerado}</strong><span>Sem estoque</span></div>
      <div class="num neutro"><strong>${r.ocultas}</strong><span>Ocultas no site</span></div>`;
  } catch { /* o resumo é só informativo */ }
}

async function carregarPecas() {
  carregarResumo();
  try {
    const p = new URLSearchParams({ admin: '1', pagina: estado.pagina });
    if (estado.q) p.set('q', estado.q);
    const r = await api(`/api/pecas?${p}`);
    const corpo = $('#tabela-pecas tbody');
    corpo.innerHTML = r.itens.length ? r.itens.map(linhaPeca).join('') : '<tr><td colspan="7" class="vazio">Nenhuma peça cadastrada ainda. Clique em “Nova peça”.</td></tr>';
    const paginas = Math.ceil(r.total / r.porPagina);
    $('#pag-pecas').innerHTML = paginas > 1
      ? `<button class="btn sec pequeno" ${r.pagina <= 1 ? 'disabled' : ''} data-ir="${r.pagina - 1}">Anterior</button><span>Página ${r.pagina} de ${paginas} (${r.total} peças)</span><button class="btn sec pequeno" ${r.pagina >= paginas ? 'disabled' : ''} data-ir="${r.pagina + 1}">Próxima</button>`
      : `<span class="contagem">${r.total} ${r.total === 1 ? 'peça' : 'peças'}</span>`;
  } catch (err) { tratar(err); }
}

function linhaPeca(p) {
  const foto = urlFoto(p.imagem);
  const cls = p.estoque === 0 ? 'estoque-zero' : p.estoque < ESTOQUE_BAIXO ? 'estoque-baixo' : '';
  return `<tr>
    <td>${foto ? `<img class="miniatura" src="${foto}" alt="">` : '<div class="miniatura">sem foto</div>'}</td>
    <td>${esc(p.codigo)}</td>
    <td><strong>${esc(p.nome)}</strong><br><small>${esc([p.marca, p.categoria].filter(Boolean).join(' · '))}</small></td>
    <td>${esc(dinheiro(p.preco_centavos) ?? 'Consulte')}</td>
    <td class="${cls}">${p.estoque}</td>
    <td>${p.ativo ? '<span class="selo ok">No site</span>' : '<span class="selo off">Oculta</span>'}${p.destaque ? ' <span class="selo dest">Destaque</span>' : ''}</td>
    <td><div class="linha-acoes">
      <button class="btn sec pequeno" data-editar="${p.id}">Editar</button>
      <button class="btn perigo pequeno" data-excluir="${p.id}" data-nome="${esc(p.nome)}">Excluir</button>
    </div></td>
  </tr>`;
}

$('#tabela-pecas').addEventListener('click', async (e) => {
  const ed = e.target.closest('[data-editar]');
  const ex = e.target.closest('[data-excluir]');
  if (ed) abrirFormulario(Number(ed.dataset.editar));
  if (ex && confirm(`Excluir a peça "${ex.dataset.nome}"?\n\nIsso não pode ser desfeito. Se só quer tirar do site, use "Editar" e desmarque "Mostrar no site".`)) {
    try { await api(`/api/pecas/${ex.dataset.excluir}`, { method: 'DELETE' }); aviso('Peça excluída.'); carregarPecas(); } catch (err) { tratar(err); }
  }
});

$('#pag-pecas').addEventListener('click', (e) => {
  const b = e.target.closest('[data-ir]');
  if (b && !b.disabled) { estado.pagina = Number(b.dataset.ir); carregarPecas(); }
});

let espera;
$('#filtro-pecas').addEventListener('input', (e) => {
  clearTimeout(espera);
  espera = setTimeout(() => { estado.q = e.target.value.trim(); estado.pagina = 1; carregarPecas(); }, 300);
});

// ---------- Formulário de peça ----------
const dlg = $('#dlg-peca');
const form = $('#form-peca');

const opcoes = (lista, atual) =>
  `<option value="">(nenhuma)</option>` + lista.map((i) => `<option value="${i.id}" ${i.id === atual ? 'selected' : ''}>${esc(i.nome)}</option>`).join('');

function linhaAplicacao(a = {}) {
  const div = document.createElement('div');
  div.className = 'linha-app';
  div.innerHTML = `
    <input placeholder="Montadora" value="${esc(a.montadora)}" data-c="montadora" maxlength="60" aria-label="Montadora">
    <input placeholder="Modelo" value="${esc(a.modelo)}" data-c="modelo" maxlength="80" aria-label="Modelo">
    <input placeholder="De" type="number" value="${a.ano_inicial ?? ''}" data-c="ano_inicial" min="1950" max="2100" aria-label="Ano inicial">
    <input placeholder="Até" type="number" value="${a.ano_final ?? ''}" data-c="ano_final" min="1950" max="2100" aria-label="Ano final">
    <input placeholder="Motor" value="${esc(a.motor)}" data-c="motor" maxlength="40" aria-label="Motor">
    <button type="button" class="btn perigo pequeno" aria-label="Remover este carro">✕</button>`;
  div.querySelector('button').onclick = () => div.remove();
  return div;
}

function mostrarFoto() {
  const f = urlFoto(estado.imagem);
  $('#previa-foto').innerHTML = f ? `<img src="${f}" alt="">` : 'Sem foto';
  $('#remover-foto').hidden = !estado.imagem;
}

async function abrirFormulario(id = null) {
  estado.editando = id;
  form.reset();
  $('#erro-peca').textContent = '';
  $('#titulo-peca').textContent = id ? 'Editar peça' : 'Nova peça';
  let p = { categoria_id: null, marca_id: null, aplicacoes: [], ativo: 1, destaque: 0 };
  if (id) {
    try { p = await api(`/api/pecas/${id}`); } catch (err) { return tratar(err); }
  }
  const f = form.elements;
  f.codigo.value = p.codigo ?? '';
  f.nome.value = p.nome ?? '';
  f.preco.value = p.preco_centavos != null ? (p.preco_centavos / 100).toFixed(2).replace('.', ',') : '';
  f.estoque.value = p.estoque ?? 0;
  f.descricao.value = p.descricao ?? '';
  f.categoria_id.innerHTML = opcoes(estado.categorias, p.categoria_id);
  f.marca_id.innerHTML = opcoes(estado.marcas, p.marca_id);
  f.ativo.checked = !!p.ativo;
  f.destaque.checked = !!p.destaque;
  estado.imagem = p.imagem || null;
  mostrarFoto();
  const caixa = $('#aplicacoes');
  caixa.innerHTML = '';
  p.aplicacoes.forEach((a) => caixa.append(linhaAplicacao(a)));
  dlg.showModal();
}

$('#nova-peca').onclick = () => abrirFormulario();
$('#cancelar-peca').onclick = () => dlg.close();
$('#add-aplicacao').onclick = () => $('#aplicacoes').append(linhaAplicacao());
$('#remover-foto').onclick = () => { estado.imagem = null; $('#arquivo-foto').value = ''; mostrarFoto(); };

$('#arquivo-foto').addEventListener('change', async (e) => {
  const arq = e.target.files[0];
  if (!arq) return;
  $('#erro-peca').textContent = '';
  const dados = new FormData();
  dados.append('foto', arq);
  try {
    const r = await api('/api/upload', { method: 'POST', body: dados });
    estado.imagem = r.imagem;
    mostrarFoto();
  } catch (err) {
    $('#erro-peca').textContent = err.message;
    e.target.value = '';
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = form.elements;
  const corpo = {
    codigo: f.codigo.value, nome: f.nome.value, preco: f.preco.value, estoque: f.estoque.value,
    descricao: f.descricao.value, categoria_id: f.categoria_id.value, marca_id: f.marca_id.value,
    imagem: estado.imagem, ativo: f.ativo.checked, destaque: f.destaque.checked,
    aplicacoes: [...document.querySelectorAll('#aplicacoes .linha-app')].map((l) =>
      Object.fromEntries([...l.querySelectorAll('[data-c]')].map((i) => [i.dataset.c, i.value]))),
  };
  try {
    if (estado.editando) await api(`/api/pecas/${estado.editando}`, { method: 'PUT', corpo });
    else await api('/api/pecas', { method: 'POST', corpo });
    dlg.close();
    aviso('Peça salva.');
    carregarPecas();
  } catch (err) {
    if (err.status === 401) tratar(err); else $('#erro-peca').textContent = err.message;
  }
});

// ---------- Categorias e marcas ----------
function desenharLista(tipo) {
  const rotulo = tipo === 'categorias' ? 'categoria' : 'marca';
  const itens = estado[tipo];
  $(`#aba-${tipo}`).innerHTML = `<div class="lista-simples">
    <form class="novo"><input placeholder="Nova ${rotulo}" maxlength="80" required><button class="btn" type="submit">Adicionar</button></form>
    ${itens.map((i) => `<div class="item"><span class="nome">${esc(i.nome)} <small>(${i.total} ${i.total === 1 ? 'peça' : 'peças'})</small></span>
      <button class="btn sec pequeno" data-renomear="${i.id}" data-nome="${esc(i.nome)}">Renomear</button>
      <button class="btn perigo pequeno" data-apagar="${i.id}" data-nome="${esc(i.nome)}">Excluir</button></div>`).join('') || `<div class="item"><span class="nome">Nenhuma ${rotulo} ainda.</span></div>`}
  </div>`;
  const raiz = $(`#aba-${tipo}`);

  raiz.querySelector('form').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api(`/api/${tipo}`, { method: 'POST', corpo: { nome: e.target.elements[0].value } });
      await carregarListas();
      desenharLista(tipo);
    } catch (err) { tratar(err); }
  };
  raiz.onclick = async (e) => {
    const r = e.target.closest('[data-renomear]');
    const a = e.target.closest('[data-apagar]');
    try {
      if (r) {
        const nome = prompt(`Novo nome da ${rotulo}:`, r.dataset.nome);
        if (nome && nome.trim()) { await api(`/api/${tipo}/${r.dataset.renomear}`, { method: 'PUT', corpo: { nome } }); await carregarListas(); desenharLista(tipo); }
      }
      if (a && confirm(`Excluir "${a.dataset.nome}"? As peças dessa ${rotulo} continuam no site, só ficam sem ${rotulo}.`)) {
        await api(`/api/${tipo}/${a.dataset.apagar}`, { method: 'DELETE' });
        await carregarListas();
        desenharLista(tipo);
      }
    } catch (err) { tratar(err); }
  };
}

iniciar();
