document.addEventListener('DOMContentLoaded', function() {

    // Seleciona todos os botões de ponto de mapa
    const mapPoints = document.querySelectorAll('.map-point');

    // Seleciona os elementos onde o nome e a descrição do ponto serão exibidos
    const pointNameElement = document.getElementById('point-info-name');
    const pointDescriptionElement = document.getElementById('point-info-description');

    // Verifica se os elementos foram encontrados para evitar erros
    if (!pointNameElement || !pointDescriptionElement) {
        console.error("Elementos do painel de informações do mapa não encontrados. Verifique se existem IDs 'point-info-name' e 'point-info-description' no seu HTML.");
        return; // Para a execução do script se os elementos não existirem
    }


    // Adiciona um listener de clique a cada ponto de mapa
    mapPoints.forEach(point => {
        point.addEventListener('click', function() {
            // Pega o nome e a descrição dos atributos data-* do botão clicado
            const pointName = this.dataset.name || 'Local Desconhecido'; // Usa um fallback se data-name não existir
            const pointDescription = this.dataset.description || 'Nenhuma informação disponível para este local.'; // Usa um fallback

            // Atualiza o texto no painel de informações
            pointNameElement.textContent = pointName;
            pointDescriptionElement.textContent = pointDescription;

            // Opcional: Adicionar uma classe 'active' ao ponto clicado para destacá-lo visualmente
            // Primeiro remove a classe 'active' de todos os outros pontos
            mapPoints.forEach(p => p.classList.remove('active'));
            // Depois adiciona a classe 'active' ao ponto clicado
            this.classList.add('active');

            console.log(`Ponto clicado: ${pointName}`); // Para debug no console
        });
    });

    // Opcional: Limpar o painel de informações ou selecionar um ponto padrão na carga inicial
    // Por padrão, o HTML já tem um texto inicial.
    // Se quiser selecionar o primeiro ponto automaticamente na carga, descomente e ajuste:
    // if (mapPoints.length > 0) {
    //    mapPoints[0].click(); // Simula um clique no primeiro ponto
    // }


    // --- Adicione outras lógicas específicas do mapa aqui, se houver ---
    // Ex: carregar dados mais complexos via API ao clicar em um ponto, etc.


    // Lógica de links da Sidebar (se necessário manter aqui ou se não estiver em um script geral)
     // Se você já tiver essa lógica em um script geral (como o seu script.js), pode remover este bloco
      document.querySelectorAll('.sidebar-nav ul li a').forEach(link => {
         if (link.textContent.includes('INÍCIO')) {
              link.href = 'index.html';
         }
          if (link.textContent.includes('PERSONAGENS')) {
              link.href = 'personagens.html';
         }
          if (link.textContent.includes('MONSTROS')) {
              link.href = 'monstro.html';
         }
          if (link.textContent.includes('SALA DE RPG')) {
              link.href = 'rpg.html';
          }
          if (link.textContent.includes('MAPA')) {
              link.href = 'mapa.html'; // Link para a própria página
          }
          if (link.textContent.includes('HISTÓRIA')) {
              link.href = 'historia.html';
          }
          if (link.textContent.includes('REGRAS')) {
              link.href = 'regras.html';
          }
          if (link.textContent.includes('CONTATO')) {
              link.href = 'contato.html';
         }
           if (link.textContent.includes('PAINEL')) {
              link.href = 'dashboard.html';
         }
     });


    // Efeito fade-in no body (se necessário manter aqui ou se não estiver em um script geral)
    // Se você já tiver essa lógica em um script geral (como o seu script.js), pode remover este bloco
     setTimeout(() => {
         document.body.style.opacity = '1';
     }, 100);


}); // Fim do DOMContentLoaded