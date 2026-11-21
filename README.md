# CBM Parts

Catálogo de autopeças com busca por veículo e painel de administrador. Feito para a loja de um colega, ainda em teste: visual, textos e produtos não foram fechados com o dono.

**Protótipo no ar:** https://cbm-parts-prototipo-xandedev.pages.dev/ (painel em `/admin/`)

## O que é e para quem

Site de catálogo para uma loja de autopeças. O cliente procura a peça pelo carro (montadora, modelo e ano) ou pelo nome ou código. A loja cadastra e edita as peças por um painel protegido por login.

## Como funciona

Exemplo: o cliente busca "Gol", ano 2014.
1. O navegador chama `/api/pecas?modelo=Gol&ano=2014`.
2. A Function (`functions/api/pecas/index.js`) consulta o banco D1 e devolve só as peças que servem nesse carro.
3. A página mostra a lista; ao abrir uma peça, aparece a tabela de aplicações (montadora, modelo, ano, motor).

## Funcionalidades

- Busca por veículo (montadora, modelo, ano) e por nome ou código da peça
- Página de cada peça com a tabela de aplicações
- Login e logout do administrador (sessão em cookie)
- Painel `/admin/`: cadastro, edição e remoção de peças, categorias e marcas
- Upload de fotos pela API, guardadas no R2 (ainda não ligado no site no ar)

## Stack

- **Cloudflare Pages:** hospeda o site e as Functions
- **Cloudflare Pages Functions** (JavaScript): a API
- **Cloudflare D1:** banco SQL (`schema.sql`)
- **Cloudflare R2:** armazenamento das fotos
- **JavaScript puro** no front, sem framework; **Wrangler** (CLI da Cloudflare) para rodar local

## Como rodar no PC

```bash
npm install
npm run db:criar        # cria as tabelas (local)
npm run db:exemplo      # opcional: peças de exemplo
node scripts/criar-admin.mjs email "Nome" "senha-de-12+-caracteres"
npx wrangler d1 execute cbm-parts --local --file=.tmp/admin.sql
npm run dev             # abre em http://localhost:8788
```

## Status

Protótipo em teste, com 4 peças de exemplo sem preço no banco de produção. Falta, antes do uso real:
- ligar o R2 (fotos) e criar o administrador do dono;
- trocar o conteúdo de exemplo por logo, categorias, peças e contatos reais (o WhatsApp está em `public/config.js`);
- não rodar `dados-exemplo.sql` e `dados-exemplo-2.sql` no banco de produção.

## Como foi feito

Desenvolvido por mim com apoio do Claude Code. Eu defini os requisitos (busca por carro, login, painel para a loja), testei e ajustei o que a IA gerou. Não escrevi o código à mão do zero. As fotos de exemplo são do Wikimedia Commons, com créditos em `public/creditos.html`.
