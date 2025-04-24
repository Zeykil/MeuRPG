document.addEventListener('DOMContentLoaded', function() {
    // URL base do seu backend Flask (ajuste se necessário)
    const API_BASE_URL = 'http://127.00.1:5000/api';

    // Seleciona todos os cards de monstros
    const monsterCards = document.querySelectorAll('.monster-card');

    // --- Funções de Comunicação com o Backend (Monstros) ---

    async function loadMonsterState(cardElement) {
        const monsterId = cardElement.dataset.id;
        if (!monsterId) return;

        try {
            // Faz a requisição GET para buscar os dados do monstro pelo ID
            const response = await fetch(`${API_BASE_URL}/monstro/${monsterId}`);

            if (response.ok) {
                const monsterState = await response.json();
                console.log(`Estado do monstro ${monsterId} carregado do backend!`, monsterState); // Para debug

                // Atualiza os elementos HTML com os dados carregados
                updateMonsterCardUI(cardElement, monsterState);

            } else if (response.status === 404) {
                console.log(`Monstro ${monsterId} não encontrado no backend. Usando dados do HTML.`);
                // Se não encontrado, usa os dados iniciais do HTML
                initializeMonsterCardUI(cardElement);
                 // Opcional: Salvar os dados iniciais do HTML no backend se não existirem?
                 // saveMonsterState(cardElement); // Descomente se quiser que todos os monstros do HTML sejam salvos ao carregar
            } else {
                console.error(`Erro ao carregar monstro ${monsterId}:`, response.status, response.statusText);
                 initializeMonsterCardUI(cardElement); // Usa dados do HTML em caso de erro
            }
        } catch (error) {
            console.error(`Erro na comunicação com o backend ao carregar ${monsterId}:`, error);
             initializeMonsterCardUI(cardElement); // Usa dados do HTML em caso de erro
        }
    }

    async function saveMonsterState(cardElement) {
        const monsterId = cardElement.dataset.id;
        if (!monsterId) return;

        // Coleta os dados ATUAIS do card na UI
        const monsterState = collectMonsterCardData(cardElement);

        try {
            // Faz a requisição PUT para salvar/atualizar os dados do monstro
            const response = await fetch(`${API_BASE_URL}/monstro/${monsterId}`, {
                method: 'PUT', // Usamos PUT para atualizar
                headers: {
                    'Content-Type': 'application/json' // Indica que o corpo é JSON
                },
                body: JSON.stringify(monsterState) // Converte o objeto JavaScript para string JSON
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`Estado do monstro ${monsterId} salvo no backend!`, result); // Para debug
            } else {
                 const errorText = await response.text();
                console.error(`Erro ao salvar monstro ${monsterId}:`, response.status, response.statusText, errorText);
                 alert(`Erro ao salvar ${monsterId}: ${response.statusText}`); // Alerta o usuário
            }
        } catch (error) {
            console.error(`Erro na comunicação com o backend ao salvar ${monsterId}:`, error);
            alert(`Erro de conexão ao salvar ${monsterId}. Verifique o servidor.`); // Alerta o usuário
        }
    }

     // --- Funções para Manipular a UI do Card de Monstro ---

     // Função para coletar todos os dados relevantes de um card de monstro
     // Por enquanto, foca apenas no HP, pois é o único interativo para salvar.
     // Dados como atributos, especiais e descrição não são editáveis na UI atual,
     // então carregamos do DB mas não os coletamos para salvar, a menos que a UI mude.
     function collectMonsterCardData(cardElement) {
        const hpInput = cardElement.querySelector('.hp-input');

        const data = {
            // Usar o nome de coluna definido no schema.sql
            hp_atual: parseInt(hpInput?.value) || 0
            // Outros dados (stats_json, abilities_json, description_json)
            // não são coletados aqui, pois não há inputs/áreas para editá-los diretamente na UI atual.
            // Se você adicionar inputs/textareas para editá-los, precisará coletá-los aqui.
        };
        return data;
     }

     // Função para atualizar a UI de um card de monstro com dados (do backend ou do HTML)
     function updateMonsterCardUI(cardElement, data) {
        const hpInput = cardElement.querySelector('.hp-input');
        const hpFill = cardElement.querySelector('.hp-fill');
        const hpText = cardElement.querySelector('.hp-text');

        // Atualiza HP
        if (hpInput && hpFill && hpText && data.hp_atual !== undefined) {
            hpInput.value = data.hp_atual;
             // Use o data-max atual do HTML para calcular a barra
             const maxHP = parseInt(hpInput.dataset.max) || 1;
             updateStatDisplay(data.hp_atual, maxHP, hpFill, hpText); // Reutiliza sua função de atualização de stat do monstro
        }

        // TODO: Se você adicionar edição para stats, abilities, description,
        // precisará adicionar lógica aqui para atualizar os elementos da UI
        // usando os campos data.stats_json, data.abilities_json, data.description_json
        // Lembre-se que eles vêm como strings JSON do DB e precisarão de JSON.parse()
     }

     // Função para inicializar a UI de um card de monstro com os dados do HTML (se não carregar do DB)
     function initializeMonsterCardUI(cardElement) {
          const hpInput = cardElement.querySelector('.hp-input');
          const hpFill = cardElement.querySelector('.hp-fill');
          const hpText = cardElement.querySelector('.hp-text');

           if (hpInput && hpFill && hpText) {
                // Atualiza a barra HP com valor inicial do HTML
                const initialHP = parseInt(hpInput.value) || 0;
                const maxHP = parseInt(hpInput.dataset.max) || 1;
                updateStatDisplay(initialHP, maxHP, hpFill, hpText);
           }
           // Não há outros elementos interativos como level/pontos em monstros na UI atual
     }


    // Função para atualizar a barra de stat (HP) (Sua função original, adaptada para receber os valores)
    // Mantida separada para clareza, mas poderia ser parte de updateMonsterCardUI
    function updateStatDisplay(currentValue, maxValue, fillElement, textElement) {
        if (!fillElement || !textElement) return;

        // Limita o valor atual entre 0 e o máximo (garante que o valor exibido está correto)
        const clampedCurrent = Math.max(0, Math.min(currentValue, maxValue));

        const percentage = (clampedCurrent / maxValue) * 100;

        fillElement.style.width = `${percentage}%`;
        textElement.textContent = `${clampedCurrent}/${maxValue}`;

        // Lógica de cor da barra de HP baseada no percentual (mantida)
        if (percentage < 20) {
            fillElement.style.backgroundColor = '#ff0000'; // Vermelho
        } else if (percentage < 50) {
            fillElement.style.backgroundColor = '#ff8c00'; // Laranja
        } else {
            fillElement.style.backgroundColor = 'var(--pixel-accent)'; // Vermelho do tema padrão
        }

         // Efeito de dano/cura visual (opcional) - Manter ou remover conforme sua preferência
         // Esta lógica é mais complexa sem botões dedicados para dano/cura no monstro,
         // pode ser ativada comparando `currentValue` com um valor anterior salvo,
         // mas a forma mais simples é ativá-la sempre que o input mudar.
         const statBarContainer = fillElement.parentElement;
         // Adicionar uma classe temporária
         statBarContainer.classList.add('stat-update-effect');
         setTimeout(() => statBarContainer.classList.remove('stat-update-effect'), 300); // Remove a classe após 300ms
    }


    // --- Inicialização e Adição de Listeners ---

    monsterCards.forEach(card => {
        // --- Carregar dados do Backend ao carregar a página ---
        loadMonsterState(card); // Chama a função para carregar o estado do monstro

        // --- Adiciona eventos de clique para os botões de toggle (mantido do original) ---
        const toggleAttributes = card.querySelector('.toggle-attributes');
        const toggleAbilities = card.querySelector('.toggle-abilities');
        const toggleDescription = card.querySelector('.toggle-description');
        const toggleCharacteristics = card.querySelector('.toggle-characteristics');

        const attributesSection = card.querySelector('.attributes-section');
        const abilitiesSection = card.querySelector('.abilities-section');
        const descriptionSection = card.querySelector('.description-section');
        const characteristicsSection = card.querySelector('.characteristics-section');

        const chevronAttributes = toggleAttributes?.querySelector('i');
        const chevronAbilities = toggleAbilities?.querySelector('i');
        const chevronDescription = toggleDescription?.querySelector('i');
        const chevronCharacteristics = toggleCharacteristics?.querySelector('i');


        // Oculta as seções inicialmente (mantido do original)
        if (attributesSection) attributesSection.classList.remove('active');
        if (abilitiesSection) abilitiesSection.classList.remove('active');
        if (descriptionSection) descriptionSection.classList.remove('active');
        if (characteristicsSection) characteristicsSection.classList.remove('active');

        if (chevronAttributes) chevronAttributes.classList.remove('fa-chevron-up');
        if (chevronAbilities) chevronAbilities.classList.remove('fa-chevron-up');
        if (chevronDescription) chevronDescription.classList.remove('fa-chevron-up');
        if (chevronCharacteristics) chevronCharacteristics.classList.remove('fa-chevron-up');


        // Listeners para os botões Toggle (mantido do original)
        // (Mantive sua lógica de fechar as outras seções ao abrir uma)
        if (toggleAttributes) {
            toggleAttributes.addEventListener('click', function(e) {
                e.stopPropagation();
                document.querySelectorAll('.monster-card .attributes-section').forEach(section => {
                    if (section !== attributesSection && section.classList.contains('active')) {
                        section.classList.remove('active');
                        const prevBtn = section.previousElementSibling;
                        if (prevBtn) { const icon = prevBtn.querySelector('i'); if (icon) icon.classList.remove('fa-chevron-up'); } } });
                attributesSection.classList.toggle('active');
                if(chevronAttributes) chevronAttributes.classList.toggle('fa-chevron-up');
                if (abilitiesSection && abilitiesSection.classList.contains('active')) { abilitiesSection.classList.remove('active'); if(chevronAbilities) chevronAbilities.classList.remove('fa-chevron-up'); }
                 if (descriptionSection && descriptionSection.classList.contains('active')) { descriptionSection.classList.remove('active'); if(chevronDescription) chevronDescription.classList.remove('fa-chevron-up'); }
                 if (characteristicsSection && characteristicsSection.classList.contains('active')) { characteristicsSection.classList.remove('active'); if(chevronCharacteristics) chevronCharacteristics.classList.remove('fa-chevron-up'); }
            });
        }

        if (toggleAbilities) {
            toggleAbilities.addEventListener('click', function(e) {
                e.stopPropagation();
                 document.querySelectorAll('.monster-card .abilities-section').forEach(section => {
                     if (section !== abilitiesSection && section !== descriptionSection && section !== characteristicsSection && section.classList.contains('active')) {
                         section.classList.remove('active');
                         const prevBtn = section.previousElementSibling;
                         if (prevBtn) { const icon = prevBtn.querySelector('i'); if (icon && (prevBtn.classList.contains('toggle-abilities') || prevBtn.classList.contains('toggle-description') || prevBtn.classList.contains('toggle-characteristics'))) { icon.classList.remove('fa-chevron-up'); } } } });
                abilitiesSection.classList.toggle('active');
                 if(chevronAbilities) chevronAbilities.classList.toggle('fa-chevron-up');
                if (attributesSection && attributesSection.classList.contains('active')) { attributesSection.classList.remove('active'); if(chevronAttributes) chevronAttributes.classList.remove('fa-chevron-up'); }
                 if (descriptionSection && descriptionSection.classList.contains('active')) { descriptionSection.classList.remove('active'); if(chevronDescription) chevronDescription.classList.remove('fa-chevron-up'); }
                 if (characteristicsSection && characteristicsSection.classList.contains('active')) { characteristicsSection.classList.remove('active'); if(chevronCharacteristics) chevronCharacteristics.classList.remove('fa-chevron-up'); }
            });
        }

         if (toggleDescription) {
            toggleDescription.addEventListener('click', function(e) {
                e.stopPropagation();
                 document.querySelectorAll('.monster-card .description-section').forEach(section => {
                     if (section !== descriptionSection && section.classList.contains('active')) {
                         section.classList.remove('active');
                         const prevBtn = section.previousElementSibling;
                         if (prevBtn) { const icon = prevBtn.querySelector('i'); if (icon && icon.parentElement.classList.contains('toggle-description')) { icon.classList.remove('fa-chevron-up'); } } } });
                descriptionSection.classList.toggle('active');
                 if(chevronDescription) chevronDescription.classList.toggle('fa-chevron-up');
                if (attributesSection && attributesSection.classList.contains('active')) { attributesSection.classList.remove('active'); if(chevronAttributes) chevronAttributes.classList.remove('fa-chevron-up'); }
                 if (abilitiesSection && abilitiesSection.classList.contains('active')) { abilitiesSection.classList.remove('active'); if(chevronAbilities) chevronAbilities.classList.remove('fa-chevron-up'); }
                 if (characteristicsSection && characteristicsSection.classList.contains('active')) { characteristicsSection.classList.remove('active'); if(chevronCharacteristics) chevronCharacteristics.classList.remove('fa-chevron-up'); }
            });
         }

         if (toggleCharacteristics) {
            toggleCharacteristics.addEventListener('click', function(e) {
                e.stopPropagation();
                 document.querySelectorAll('.monster-card .characteristics-section').forEach(section => {
                     if (section !== characteristicsSection && section.classList.contains('active')) {
                         section.classList.remove('active');
                         const prevBtn = section.previousElementSibling;
                         if (prevBtn) { const icon = prevBtn.querySelector('i'); if (icon && icon.parentElement.classList.contains('toggle-characteristics')) { icon.classList.remove('fa-chevron-up'); } } } });
                characteristicsSection.classList.toggle('active');
                 if(chevronCharacteristics) chevronCharacteristics.classList.toggle('fa-chevron-up');
                if (attributesSection && attributesSection.classList.contains('active')) { attributesSection.classList.remove('active'); if(chevronAttributes) chevronAttributes.classList.remove('fa-chevron-up'); }
                 if (abilitiesSection && abilitiesSection.classList.contains('active')) { abilitiesSection.classList.remove('active'); if(chevronAbilities) chevronAbilities.classList.remove('fa-chevron-up'); }
                 if (descriptionSection && descriptionSection.classList.contains('active')) { descriptionSection.classList.remove('active'); if(chevronDescription) chevronDescription.classList.remove('fa-chevron-up'); }
            });
         }


        // --- Lógica de HP Input (Adaptada para SALVAR) ---
        const hpInput = card.querySelector('.hp-input');
        const hpFill = card.querySelector('.hp-fill');
        const hpText = card.querySelector('.hp-text');
        const maxHP = hpInput ? parseInt(hpInput.dataset.max) || 1 : 1; // Padrão 1 para evitar divisão por zero


        // Listener para o evento 'input' no campo HP
        if (hpInput) {
             hpInput.addEventListener('input', function() {
                 let currentHP = parseInt(this.value) || 0;
                 // Limita o valor entre 0 e o HP máximo (mantido do original)
                 if (currentHP < 0) currentHP = 0;
                 if (currentHP > maxHP) currentHP = maxHP;
                 this.value = currentHP; // Atualiza o valor do input

                 updateStatDisplay(currentHP, maxHP, hpFill, hpText); // Atualiza a UI
                 saveMonsterState(card); // Salva no backend após a mudança
            });
             // A atualização inicial da UI é feita por loadMonsterState/initializeMonsterCardUI
        }


        // --- Lógica de Filtros (mantida do original, fora do loop forEach) ---
        // (Código dos filtros permanece o mesmo)

        // --- Efeito Hover (mantido do original, fora do loop forEach) ---
        // (Código do hover permanece o mesmo)


         // --- Lógica de Modal de Edição (Removida e não adicionada aqui) ---
         // Se você precisar de um modal de edição para monstros, precisará implementá-lo
         // e adicionar chamadas a saveMonsterState quando os dados forem alterados no modal.

    }); // Fim do loop monsterCards.forEach


    // --- Código de filtros e efeitos globais (mantido do original, fora do loop de cards) ---
    const searchInput = document.querySelector('.search-input');

    // Adiciona listener APENAS SE o input de busca existir
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterMonsters(); // Chama a função de filtro
        });
    }

    function filterMonsters() { // Função de filtro adaptada para monstros
         const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
         const monsterCards = document.querySelectorAll('.monster-card'); // Seleciona novamente dentro da função

         monsterCards.forEach(card => { // Iterar sobre monsterCards
             const monsterName = card.querySelector('h2').textContent.toLowerCase();
             const matchesSearch = monsterName.includes(searchTerm);

             if (matchesSearch) {
                 card.style.display = 'block';
             } else {
                 card.style.display = 'none';
             }
         });
     }

    // Efeito de brilho no toggle-btn (mantido do original, fora do loop forEach)
    document.querySelectorAll('.toggle-btn').forEach(button => {
        button.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect(); // Pega a posição do elemento
            const x = e.clientX - rect.left; // Posição X relativa ao elemento
            const y = e.clientY - rect.top;   // Posição Y relativa ao elemento
            this.style.setProperty('--x', `${x}px`);
            this.style.setProperty('--y', `${y}px`);
        });
    });


    // Efeito fade-in no body (mantido do original)
     setTimeout(() => {
         document.body.style.opacity = '1';
     }, 100);

     // Adiciona links da sidebar (adaptado para a página de monstros)
      document.querySelectorAll('.sidebar-nav ul li a').forEach(link => {
         if (link.textContent.includes('INÍCIO')) {
              link.href = 'index.html'; // Ou qual for sua página inicial
         }
          if (link.textContent.includes('PERSONAGENS')) {
              link.href = 'personagens.html'; // Link para a página de personagens
         }
          if (link.textContent.includes('HISTÓRIA')) {
              link.href = 'historia.html'; // Link para a página de história
          }
          if (link.textContent.includes('REGRAS')) {
              link.href = 'regras.html'; // Link para a página de regras
          }
          if (link.textContent.includes('CONTATO')) {
              link.href = 'contato.html'; // Link para a página de contato
          }
           if (link.textContent.includes('PAINEL')) {
              link.href = 'dashboard.html'; // Link para a página do dashboard
         }
         // Adicione outros links da sidebar conforme necessário
     });


}); // Fim do DOMContentLoaded