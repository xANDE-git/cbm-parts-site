// Escolhe o tema do site: "azul" (azul e dourado) ou "preto" (preto e cinza).
// Vale o que vier no endereço (?tema=preto), depois o último escolhido, depois "azul".
(function () {
  var html = document.documentElement;
  if (!document.querySelector('.painel') && location.pathname.indexOf('/admin') !== 0) {
    var tema = 'azul';
    try {
      var url = new URLSearchParams(location.search).get('tema');
      if (url === 'preto' || url === 'azul') sessionStorage.setItem('tema', url);
      var guardado = sessionStorage.getItem('tema');
      if (guardado === 'preto' || guardado === 'azul') tema = guardado;
    } catch (e) { /* sem armazenamento: fica no padrão */ }
    html.setAttribute('data-tema', tema);
  }
  document.addEventListener('DOMContentLoaded', function () {
    var botao = document.getElementById('tema-btn');
    if (!botao) return;
    botao.addEventListener('click', function () {
      var novo = html.getAttribute('data-tema') === 'preto' ? 'azul' : 'preto';
      html.setAttribute('data-tema', novo);
      try { sessionStorage.setItem('tema', novo); } catch (e) { /* ok */ }
      botao.setAttribute('aria-label', 'Trocar tema (agora: ' + novo + ')');
    });
  });
})();
