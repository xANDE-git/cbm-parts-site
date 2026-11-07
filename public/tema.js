// Escolhe o tema da página antes de ela aparecer (por isso é um arquivo separado, no <head>).
//  Site dos clientes: "preto" (padrão) ou "azul" (azul e dourado, guardado como alternativa).
//  Painel do administrador (/admin/): "preto" (igual ao site) ou "oficina" (claro, cores contrárias).
// Vale o que vier no endereço (?tema=oficina), depois o último escolhido, depois o padrão.
(function () {
  var html = document.documentElement;
  var admin = location.pathname.indexOf('/admin') === 0;
  var opcoes = admin ? ['preto', 'oficina'] : ['preto', 'azul'];
  var chave = admin ? 'tema-painel' : 'tema';
  var tema = 'preto';
  try {
    var url = new URLSearchParams(location.search).get('tema');
    if (opcoes.indexOf(url) >= 0) sessionStorage.setItem(chave, url);
    var guardado = sessionStorage.getItem(chave);
    if (opcoes.indexOf(guardado) >= 0) tema = guardado;
  } catch (e) { /* sem armazenamento: fica no padrão */ }
  html.setAttribute('data-tema', tema);

  document.addEventListener('DOMContentLoaded', function () {
    var botao = document.getElementById('tema-btn');
    if (!botao) return;
    botao.addEventListener('click', function () {
      var atual = html.getAttribute('data-tema');
      var novo = opcoes[(opcoes.indexOf(atual) + 1) % opcoes.length];
      html.setAttribute('data-tema', novo);
      try { sessionStorage.setItem(chave, novo); } catch (e) { /* ok */ }
    });
  });
})();
