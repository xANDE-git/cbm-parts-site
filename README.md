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

## Publicação (protótipo no ar)
- Link: https://cbm-parts-prototipo-xandedev.pages.dev (painel em `/admin/`)
- GitHub: `xANDE-git/cbm-parts-site` (privado). Cada push na `main` publica sozinho.
- Cloudflare: projeto Pages `cbm-parts-prototipo-xandedev`, banco D1 `cbm-parts` (id no `wrangler.toml`).
- Login do protótipo: `.tmp/login-producao.txt` (fora do Git). Trocar por login do dono na versão final.
- **Fotos desligadas:** falta ativar o R2 no painel da Cloudflare (pode pedir cartão), criar o bucket `cbm-parts-fotos` e acrescentar o bloco `[[env.production.r2_buckets]]` no `wrangler.toml`.
- No banco de produção há 4 peças de exemplo SEM preço, só para o visual. Apagar antes de cadastrar os produtos reais.

## Visual v3 e imagens de exemplo
- Direção: "industrial premium" (aço + dourado, títulos em Barlow Condensed itálico, texto em Inter, fontes em `public/fonts/`, licença OFL).
- Referências olhadas: Brembo e Bilstein (escuro, cinematográfico, tipografia condensada), Mann-Filter (busca em destaque). Evitado: o estilo "banners e selos de preço por todo lado" de lojas como Peça Agora.
- Fotos de exemplo em `public/exemplos/` (Wikimedia Commons; créditos em `public/creditos.html`). Nomes `exemplo-*.jpg` são tratados como "Imagem ilustrativa". Trocar pelas fotos reais.
- `dados-exemplo-2.sql`: mais 5 peças de exemplo (sem preço). Apagar antes dos produtos reais.
- `public/config.js`: preencher `WHATSAPP` quando o dono passar o número; o botão "Pedir orçamento" aparece sozinho.
- Servidor de teste local travou uma vez ao mudar o `wrangler.toml`: se acontecer, parar os `workerd` e rodar `npm run dev` de novo.

## Temas (v5)
- Dois temas no mesmo site: `azul` (azul-marinho e dourado, guardado como alternativa) e `preto` (preto e cinza com âmbar, **padrão escolhido**). Troca pelo botão "Tema" no topo ou pelo endereço `?tema=preto` / `?tema=azul` (o escolhido fica guardado enquanto a aba estiver aberta).
- `public/tema.js` escolhe o tema antes de a página aparecer; as cores ficam nas variáveis do `:root` e no bloco `TEMA PRETO E CINZA` do `style.css`. O painel `/admin/` não usa os temas.
- Quando o dono escolher, é só apagar o outro tema (e o botão).
- O botão "Tema" está escondido (`.tema-btn { display: none }` no fim do `style.css`). O azul continua acessível em `?tema=azul`; para voltar a ele como padrão, troque `var tema = 'preto'` por `'azul'` no `tema.js`.
