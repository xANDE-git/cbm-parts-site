// Funções usadas nas páginas públicas e no painel.
document.documentElement.classList.add('js'); // liga os efeitos que dependem de JavaScript

export const $ = (sel, raiz = document) => raiz.querySelector(sel);

// Protege contra código malicioso escondido em textos cadastrados.
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const dinheiro = (centavos) =>
  centavos == null ? null : (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Fotos de exemplo ficam no próprio site; as reais (enviadas pelo painel) ficam no R2.
export const ehExemplo = (nome) => typeof nome === 'string' && nome.startsWith('exemplo-');
export const urlFoto = (nome) => (nome ? `${ehExemplo(nome) ? '/exemplos' : '/imagens'}/${encodeURIComponent(nome)}` : null);

export function anos(a) {
  if (a.ano_inicial && a.ano_final) return a.ano_inicial === a.ano_final ? String(a.ano_inicial) : `${a.ano_inicial} a ${a.ano_final}`;
  if (a.ano_inicial) return `${a.ano_inicial} em diante`;
  if (a.ano_final) return `até ${a.ano_final}`;
  return 'todos';
}

export async function api(caminho, opcoes = {}) {
  const init = { credentials: 'same-origin', ...opcoes };
  if (opcoes.corpo !== undefined) {
    init.body = JSON.stringify(opcoes.corpo);
    init.headers = { 'content-type': 'application/json' };
    delete init.corpo;
  }
  const r = await fetch(caminho, init);
  let dados = null;
  try { dados = await r.json(); } catch { /* sem corpo */ }
  if (!r.ok) {
    const e = new Error(dados?.erro || 'Algo deu errado. Tente novamente.');
    e.status = r.status;
    throw e;
  }
  return dados;
}

// ---------- Ícones das categorias (desenhados à mão, traço simples) ----------
const SVG = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONES = {
  filtro: SVG('<rect x="6.5" y="6" width="11" height="14" rx="2.2"/><path d="M8.5 3.5h7M9 9.5v7M12 9.5v7M15 9.5v7"/>'),
  freio: SVG('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="6.4" r=".8"/><circle cx="17.2" cy="9" r=".8"/><circle cx="17.2" cy="15" r=".8"/><circle cx="12" cy="17.6" r=".8"/><circle cx="6.8" cy="15" r=".8"/><circle cx="6.8" cy="9" r=".8"/>'),
  suspensao: SVG('<path d="M12 2.5v3M12 18.5v3M8 5.5h8M8 18.5h8M8 5.5l8 3-8 3 8 3-8 3 8-1.5"/>'),
  ignicao: SVG('<path d="M9 3.5h6M10 3.5v5h4v-5M9.5 8.5h5M12 8.5v8.5M10.5 17h3M12 17v3.5"/><path d="M15.5 5.5l1.5-1.2M8.5 5.5L7 4.3" />'),
  correia: SVG('<rect x="3" y="7" width="18" height="10" rx="5"/><path d="M8 7v-1.5M12 7v-1.5M16 7v-1.5M8 17v1.5M12 17v1.5M16 17v1.5"/>'),
  embreagem: SVG('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>'),
  engrenagem: SVG('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8"/><circle cx="12" cy="12" r="6.5"/>'),
};
export function iconeCategoria(nome = '') {
  const t = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (t.includes('filtro')) return ICONES.filtro;
  if (t.includes('freio')) return ICONES.freio;
  if (t.includes('suspens') || t.includes('amortec')) return ICONES.suspensao;
  if (t.includes('ignic') || t.includes('vela')) return ICONES.ignicao;
  if (t.includes('correia')) return ICONES.correia;
  if (t.includes('embreag')) return ICONES.embreagem;
  return ICONES.engrenagem;
}

// ---------- Efeitos ----------
// Faz os blocos "aparecerem" ao rolar a página.
export function revelar(raiz = document) {
  const itens = [...raiz.querySelectorAll('.rev:not(.on)')];
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    itens.forEach((el) => el.classList.add('on'));
    return;
  }
  const obs = new IntersectionObserver((entradas) => {
    for (const e of entradas) if (e.isIntersecting) { e.target.classList.add('on'); obs.unobserve(e.target); }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  itens.forEach((el) => obs.observe(el));
}

// Atrasos escalonados (feitos por JavaScript porque a segurança do site bloqueia estilo escrito no HTML).
export function escalonar(lista, passo = 0.05, maximo = 8) {
  [...lista].forEach((el, i) => el.style.setProperty('--atraso', `${(i % maximo) * passo}s`));
}

// Cabeçalho que encolhe um pouco ao rolar.
export function iniciarTopo() {
  const topo = document.querySelector('.topo');
  if (!topo) return;
  const ajustar = () => topo.classList.toggle('rolou', scrollY > 24);
  addEventListener('scroll', ajustar, { passive: true });
  ajustar();
}
