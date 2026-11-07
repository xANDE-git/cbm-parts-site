// Funções usadas nas páginas públicas e no painel.
export const $ = (sel, raiz = document) => raiz.querySelector(sel);

// Protege contra código malicioso escondido em textos cadastrados.
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const dinheiro = (centavos) =>
  centavos == null ? null : (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const urlFoto = (nome) => (nome ? `/imagens/${encodeURIComponent(nome)}` : null);

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
