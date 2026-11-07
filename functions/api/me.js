import { json, usuarioLogado } from '../_lib/util.js';

// O painel pergunta aqui se ainda está logado.
export async function onRequestGet(context) {
  const u = await usuarioLogado(context);
  return u ? json({ logado: true, nome: u.nome, email: u.email }) : json({ logado: false }, 401);
}
