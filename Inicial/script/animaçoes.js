document.addEventListener('DOMContentLoaded', function() {

    // --- Animação 1: Fade-in Geral na Carga da Página ---
    // (Você já tem um setTimeout para opacity: 1 no body, podemos manter ou substituir)
    // Se você já tem `document.body.style.opacity = '1';` com um setTimeout,
    // este código abaixo pode não ser necessário ou precisar de ajuste no CSS.
    // Vamos assumir que o body começa com opacity: 0 no CSS.
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        // Adiciona uma classe para iniciar a transição
        appContainer.classList.add('fade-in');
        // Adicione no seu styles.css:
        // .app-container { opacity: 0; transition: opacity 0.8s ease-out; }
        // .app-container.fade-in { opacity: 1; }
    }


    // --- Animação 2: Animação sutil em elementos que aparecem (ex: cards, seções) ---
    // Usa Intersection Observer para animar elementos conforme aparecem na tela.
    const animateOnScrollElements = document.querySelectorAll('.character-card, .monster-card, .story-segment, .calculator-block, .dice-roller-section .section-content, .pixel-panel-deco'); // Adicione mais seletores conforme necessário

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Para animar apenas uma vez
            }
        });
    }, { threshold: 0.2 }); // Threshold 0.2 significa que 20% do elemento precisa estar visível

    animateOnScrollElements.forEach(element => {
        observer.observe(element);
        // Adicione estilos CSS como:
        // .character-card, .monster-card, ... { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
        // .character-card.is-visible, .monster-card.is-visible, ... { opacity: 1; transform: translateY(0); }
    });


    // --- Animação 3: Animação ao abrir/fechar seções (Atributos, Habilidades, etc.) ---
    // Isso é feito principalmente com CSS transitions na altura ou max-height
    // A classe 'active' já controla a visibilidade. Precisamos garantir que o CSS
    // tenha uma transição suave para 'max-height' ou 'height' e 'opacity'.
    // Exemplo de CSS (em personagem.css, monstro.css):
    // .attributes-section, .abilities-section, .description-section {
    //     max-height: 0; // Escondido
    //     overflow: hidden;
    //     opacity: 0;
    //     transition: max-height 0.5s ease-out, opacity 0.5s ease-out;
    // }
    // .attributes-section.active, .abilities-section.active, .description-section.active {
    //     max-height: 1000px; // Um valor grande o suficiente
    //     opacity: 1;
    // }
    // O JavaScript nos outros arquivos (script.js, monstros.js) já adiciona/remove a classe 'active'.
    // Não precisamos adicionar JS aqui, apenas garantir o CSS adequado.


    // --- Animação 4: Animação em botões pixel art ao clicar (pequena escala ou bounce) ---
    // Isso é feito com CSS :active pseudo-classe
    // Exemplo de CSS (em styles.css ou personagem.css para .pixel-button):
    // .pixel-button:active {
    //     transform: scale(0.95); // Encolhe ligeiramente
    //     transition: transform 0.1s ease-out;
    // }
    // ou um "pixel bounce" (ajustar transform e box-shadow):
    // .pixel-button:active {
    //      transform: translate(2px, 2px); // Move para baixo e para direita
    //      box-shadow: none; // Remove a sombra para simular o clique
    // }
    // O JavaScript não é estritamente necessário aqui, é mais uma animação CSS.


    // --- Animação 5: Animação de estado em inputs (HP, Mana) ao mudar valor ---
    // A função updateStatDisplay no script.js/monstros.js já adiciona/remove a classe 'stat-update-effect'.
    // Precisamos apenas adicionar o CSS para essa classe.
    // Exemplo de CSS (em personagem.css ou monstro.css):
    // .stat-bar-fill { transition: width 0.3s ease-out, background-color 0.3s ease-out; } /* Transição suave no preenchimento */
    // .stat-bar-container.stat-update-effect { animation: statFlash 0.3s ease-out; } /* Animação ao atualizar */
    // @keyframes statFlash {
    //     0% { filter: brightness(1.5); }
    //     100% { filter: brightness(1); }
    // }


    // Você pode adicionar outras animações aqui, como:
    // - Animar a sidebar ao abrir/fechar (se ela for responsiva e tiver um toggle)
    // - Animar ícones pixelados em hover
    // - Animações de sprites CSS para efeitos mais avançados (requer spritesheets e CSS)


    console.log("animaçoes.js carregado. Adicionando animações sutis.");

}); // Fim do DOMContentLoaded