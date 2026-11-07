import { json, erro, exigirAdmin } from '../_lib/util.js';

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

// Confere o "começo" do arquivo para ter certeza de que é mesmo uma imagem (não confia no nome).
function tipoDaImagem(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: 'png', mime: 'image/png' };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return { ext: 'webp', mime: 'image/webp' };
  return null;
}

export async function onRequestPost(context) {
  const auth = await exigirAdmin(context);
  if (auth.resposta) return auth.resposta;

  if (!context.env.FOTOS) return erro('O envio de fotos ainda não está ativado neste site.', 503);

  let arquivo;
  try {
    arquivo = (await context.request.formData()).get('foto');
  } catch {
    return erro('Envio inválido.');
  }
  if (!arquivo || typeof arquivo === 'string') return erro('Escolha uma foto.');
  if (arquivo.size > MAX_BYTES) return erro('A foto passa de 3 MB. Reduza o tamanho e tente de novo.');

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const tipo = tipoDaImagem(bytes);
  if (!tipo) return erro('Use uma foto JPG, PNG ou WebP.');

  const nome = `${crypto.randomUUID()}.${tipo.ext}`;
  await context.env.FOTOS.put(nome, bytes, { httpMetadata: { contentType: tipo.mime } });
  return json({ imagem: nome }, 201);
}
