# CBM Parts: catálogo com painel (base nível 1)

Catálogo de peças com área de administrador. **Base provisória**: visual, textos e produtos ainda não foram combinados com o dono.

## Como funciona
- `public/`: o site (vitrine em `/`, peça em `/peca.html?id=`, painel em `/admin/`).
- `functions/`: a API (roda na Cloudflare). Login, peças, categorias, marcas e upload de fotos.
- Banco: Cloudflare D1 (`schema.sql`). Fotos: Cloudflare R2.

## Rodar no seu PC
```bash
npm install
npm run db:criar                 # cria as tabelas (local)
npm run db:exemplo               # opcional: peças de exemplo
node scripts/criar-admin.mjs email "Nome" "senha-de-12+-caracteres"
npx wrangler d1 execute cbm-parts --local --file=.tmp/admin.sql
npm run dev                      # abre em http://localhost:8788
```

## Antes de publicar de verdade (pendências)
- Criar o banco D1 e o bucket R2 na Cloudflare e colocar o `database_id` real no `wrangler.toml`.
- Ligar o R2 na conta (pode pedir cartão de crédito, mesmo com uso gratuito).
- Criar o admin do dono com senha forte (`--remote`). Nunca usar o admin de teste.
- NÃO publicar `dados-exemplo.sql`.
- Definir com o cliente: logo, cores, categorias reais (o Instagram mostra freio, suspensão, embreagem, direção, não só filtros), telefone/WhatsApp, endereço, se vende online ou só mostra o catálogo.
- Trocar o aviso "Base em construção" e remover `noindex` quando estiver aprovado.
- Backup periódico do banco (`wrangler d1 export`).
