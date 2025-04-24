document.addEventListener('DOMContentLoaded', function() {
    // URL base do seu backend Flask
    const API_BASE_URL = 'http://127.0.0.1:5000/api';

    // Seleciona todos os cards de personagem
    const characterCards = document.querySelectorAll('.character-card');

    // --- Funções de Comunicação com o Backend ---

    async function loadCharacterState(cardElement) {
        const characterId = cardElement.dataset.id;
        if (!characterId) return;

        try {
            // Faz a requisição GET para buscar os dados do personagem pelo ID
            const response = await fetch(`${API_BASE_URL}/personagem/${characterId}`);

            if (response.ok) {
                const characterState = await response.json();
                console.log(`Estado do personagem ${characterId} carregado do backend!`, characterState); // Para debug

                // Atualiza os elementos HTML com os dados carregados
                updateCardUI(cardElement, characterState);

            } else if (response.status === 404) {
                console.log(`Personagem ${characterId} não encontrado no backend. Usando dados do HTML.`);
                // Se não encontrado, usa os dados iniciais do HTML e talvez salve-os no backend?
                // Por enquanto, apenas usamos o que está no HTML
                 initializeCardUI(cardElement); // Inicializa a UI com dados do HTML se não houver no DB
            } else {
                console.error(`Erro ao carregar personagem ${characterId}:`, response.status, response.statusText);
                 initializeCardUI(cardElement); // Usa dados do HTML em caso de erro na requisição
            }
        } catch (error) {
            console.error(`Erro na comunicação com o backend ao carregar ${characterId}:`, error);
             initializeCardUI(cardElement); // Usa dados do HTML em caso de erro de rede/outro
        }
    }

    async function saveCharacterState(cardElement) {
        const characterId = cardElement.dataset.id;
        if (!characterId) return;

        // Coleta os dados ATUAIS do card na UI (depois que foram modificados)
        const characterState = collectCardData(cardElement);

        try {
            // Faz a requisição PUT para salvar/atualizar os dados do personagem
            const response = await fetch(`${API_BASE_URL}/personagem/${characterId}`, {
                method: 'PUT', // Usamos PUT para atualizar
                headers: {
                    'Content-Type': 'application/json' // Indica que o corpo é JSON
                },
                body: JSON.stringify(characterState) // Converte o objeto JavaScript para string JSON
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`Estado do personagem ${characterId} salvo no backend!`, result); // Para debug
            } else {
                const errorText = await response.text(); // Pega o texto do erro para debug
                console.error(`Erro ao salvar personagem ${characterId}:`, response.status, response.statusText, errorText);
                alert(`Erro ao salvar ${characterId}: ${response.statusText}`); // Alerta o usuário em caso de erro
            }
        } catch (error) {
            console.error(`Erro na comunicação com o backend ao salvar ${characterId}:`, error);
            alert(`Erro de conexão ao salvar ${characterId}. Verifique o servidor.`); // Alerta o usuário
        }
    }

    // --- Funções para Manipular a UI do Card (Existiam, foram adaptadas/movidas) ---

     // Função para coletar todos os dados relevantes de um card
     function collectCardData(cardElement) {
        const hpInput = cardElement.querySelector('.hp-input');
        const manaInput = cardElement.querySelector('.mana-input'); // ou estamina-input
        const levelElement = cardElement.querySelector('.character-level');
        const pointsDisplay = cardElement.querySelector('.remaining-points');
        const attributeValueElements = cardElement.querySelectorAll('.attributes-grid .attr-value');

        const attributesData = {};
         attributeValueElements.forEach(attrSpan => {
             const attrName = attrSpan.closest('.attribute').querySelector('.attr-name').textContent;
             attributesData[`${attrName.toLowerCase()}_attr`] = parseInt(attrSpan.textContent) || 0; // Ex: for_attr
         });


        const data = {
            // Usar os nomes de coluna definidos no schema.sql
            hp_atual: parseInt(hpInput?.value) || 0,
            // Verifica se existe manaInput ou estaminaInput e pega o valor
            mana_estamina_atual: parseInt((manaInput || cardElement.querySelector('.estamina-input'))?.value) || 0,
            level: parseInt(levelElement?.textContent.replace('NÍVEL ', '')) || 0,
            pontos_disponiveis: parseInt(pointsDisplay?.textContent) || 0,
            ...attributesData // Adiciona os atributos coletados
        };
        return data;
     }

     // Função para atualizar a UI de um card com dados (do backend ou do HTML)
     function updateCardUI(cardElement, data) {
        const hpInput = cardElement.querySelector('.hp-input');
        const hpFill = cardElement.querySelector('.hp-fill');
        const hpText = cardElement.querySelector('.hp-text');

        const manaInput = cardElement.querySelector('.mana-input');
        const estaminaInput = cardElement.querySelector('.estamina-input');
        const resourceInput = manaInput || estaminaInput;
        const resourceFill = manaInput ? cardElement.querySelector('.mana-fill') : cardElement.querySelector('.estamina-fill');
        const resourceText = manaInput ? cardElement.querySelector('.mana-text') : cardElement.querySelector('.estamina-text');

        const levelElement = cardElement.querySelector('.character-level');
        const pointsDisplay = cardElement.querySelector('.remaining-points');
        const attributeValueElements = cardElement.querySelectorAll('.attributes-grid .attr-value');

        // Atualiza HP
        if (hpInput && data.hp_atual !== undefined) {
            hpInput.value = data.hp_atual;
             // Chamar a função updateStat para atualizar a barra e o texto
             if (hpFill && hpText) {
                  // Use o data-max atual do HTML
                  const maxHP = parseInt(hpInput.dataset.max) || 1;
                  updateStat(hpInput, hpFill, hpText); // Reutiliza sua função de atualização de stat
             }
        }

         // Atualiza Mana/Estamina
         if (resourceInput && data.mana_estamina_atual !== undefined) {
             resourceInput.value = data.mana_estamina_atual;
              // Chamar a função updateStat para atualizar a barra e o texto
              if (resourceFill && resourceText) {
                   // Use o data-max atual do HTML
                   const maxResource = parseInt(resourceInput.dataset.max) || 1;
                   updateStat(resourceInput, resourceFill, resourceText); // Reutiliza sua função de atualização de stat
              }
         }

        // Atualiza Nível
        if (levelElement && data.level !== undefined) {
            levelElement.textContent = `NÍVEL ${data.level}`;
             cardElement.dataset.level = data.level; // Atualiza o data attribute
        }

        // Atualiza Pontos
        if (pointsDisplay && data.pontos_disponiveis !== undefined) {
            pointsDisplay.textContent = data.pontos_disponiveis;
            cardElement.dataset.currentPoints = data.pontos_disponiveis; // Atualiza o data attribute
        }

        // Atualiza os valores dos atributos
        if (data) { // Verifica se 'data' existe
             attributeValueElements.forEach(attrSpan => {
                 const attrName = attrSpan.closest('.attribute').querySelector('.attr-name').textContent;
                 const dataKey = `${attrName.toLowerCase()}_attr`; // Constrói a chave esperada no objeto data (ex: 'for_attr')
                 if (data[dataKey] !== undefined) {
                     attrSpan.textContent = data[dataKey];
                 }
             });
         }

         // Chama a função de atualização de display de level/pontos para garantir que os botões estejam corretos
         updateLevelAndPointsDisplay(cardElement);
     }

     // Função para inicializar a UI de um card com os dados do HTML (se não carregar do DB)
     function initializeCardUI(cardElement) {
          const hpInput = cardElement.querySelector('.hp-input');
          const hpFill = cardElement.querySelector('.hp-fill');
          const hpText = cardElement.querySelector('.hp-text');
           if (hpInput && hpFill && hpText) {
                updateStat(hpInput, hpFill, hpText); // Atualiza a barra HP com valor inicial do HTML
           }
           const manaInput = cardElement.querySelector('.mana-input');
           const estaminaInput = cardElement.querySelector('.estamina-input');
           const resourceInput = manaInput || estaminaInput;
           const resourceFill = manaInput ? cardElement.querySelector('.mana-fill') : cardElement.querySelector('.estamina-fill');
           const resourceText = manaInput ? cardElement.querySelector('.mana-text') : cardElement.querySelector('.estamina-text');
           if (resourceInput && resourceFill && resourceText) {
                updateStat(resourceInput, resourceFill, resourceText); // Atualiza a barra Mana/Estamina com valor inicial do HTML
           }

           // Inicializa o display de level/pontos com valores do HTML
           updateLevelAndPointsDisplay(cardElement);

           // Inicializa o data-base-value para cada atributo se não existir (já estava no seu código original, mas bom garantir)
           const attributeValues = cardElement.querySelectorAll('.attributes-grid .attr-value');
           attributeValues.forEach(attrValueSpan => {
                if (!attrValueSpan.dataset.baseValue) {
                    attrValueSpan.dataset.baseValue = parseInt(attrValueSpan.textContent) || 0;
                }
            });
     }


     // Função para atualizar a exibição de nível e pontos e o estado dos botões (Adaptada para receber o card)
    function updateLevelAndPointsDisplay(cardElement) {
        const levelElement = cardElement.querySelector('.character-level');
        const pointsDisplay = cardElement.querySelector('.remaining-points');
        const increaseAttrBtns = cardElement.querySelectorAll('.increase-attr'); // Todos os botões de aumentar atributo

        const currentLevel = parseInt(cardElement.dataset.level) || 0;
        const availablePoints = parseInt(cardElement.dataset.currentPoints) || 0;

        if(levelElement) levelElement.textContent = `NÍVEL ${currentLevel}`;
        if(pointsDisplay) pointsDisplay.textContent = availablePoints;

        // Desabilitar botões de aumentar atributo se não houver pontos
        increaseAttrBtns.forEach(btn => {
             btn.disabled = availablePoints <= 0;
             btn.style.opacity = availablePoints <= 0 ? '0.5' : '1'; // Feedback visual
             btn.style.cursor = availablePoints <= 0 ? 'not-allowed' : 'pointer';
        });
    }

    // Função para atualizar a barra e o texto de um stat (HP, Mana, Estamina) (Sua função original, ligeiramente adaptada)
    function updateStat(inputElement, fillElement, textElement) {
        if (!inputElement || !fillElement || !textElement) return;

        const current = parseInt(inputElement.value) || 0; // Pega o valor do input, padrão 0 se inválido
        const max = parseInt(inputElement.dataset.max) || 1; // Pega o valor máximo do data-max, padrão 1 para evitar divisão por zero

        // Limita o valor atual entre 0 e o máximo
        const clampedCurrent = Math.max(0, Math.min(current, max));
        inputElement.value = clampedCurrent; // Atualiza o input com o valor limitado

        const percentage = (clampedCurrent / max) * 100;

        fillElement.style.width = `${percentage}%`;
        textElement.textContent = `${clampedCurrent}/${max}`;

        // Adiciona efeitos visuais (opcional) - Adaptado para ser menos dependente do previousValue no texto
        const statBarContainer = fillElement.parentElement;
        // Podemos adicionar uma classe temporária e verificar se o valor mudou
         // Uma forma simples é adicionar classes e remover após um tempo
         // if (inputElement.dataset.previousValue !== undefined) {
         //     const previousValue = parseInt(inputElement.dataset.previousValue);
         //     if (clampedCurrent < previousValue) {
         //          statBarContainer.classList.add('damage-effect');
         //          setTimeout(() => statBarContainer.classList.remove('damage-effect'), 300);
         //      } else if (clampedCurrent > previousValue) {
         //          statBarContainer.classList.add('heal-effect');
         //          setTimeout(() => statBarContainer.classList.remove('heal-effect'), 300);
         //      }
         // }
         // inputElement.dataset.previousValue = clampedCurrent; // Salva o valor atual para a próxima comparação


         // Atualiza a cor do fill para HP conforme o percentual
         if (fillElement.parentElement.classList.contains('hp-bar')) { // Verifica se é a barra de HP
             if (percentage < 20) {
                fillElement.style.backgroundColor = '#ff0000'; // Vermelho
             } else if (percentage < 50) {
                fillElement.style.backgroundColor = '#ff8c00'; // Laranja
             } else {
                 fillElement.style.backgroundColor = 'var(--pixel-accent)'; // Vermelho do tema padrão
             }
         }
         // TODO: Adicionar lógica similar para Mana/Estamina se quiserem cores diferentes em % baixos
    }


    // --- Inicialização e Adição de Listeners ---

    characterCards.forEach(card => {
        // --- Carregar dados do Backend ao carregar a página ---
        loadCharacterState(card); // Chama a função para carregar o estado do card

        // --- Adiciona eventos de clique para os botões de toggle ---
        const toggleAttributes = card.querySelector('.toggle-attributes');
        const toggleAbilities = card.querySelector('.toggle-abilities');
        const attributesSection = card.querySelector('.attributes-section');
        const abilitiesSection = card.querySelector('.abilities-section');
        const chevronAttributes = toggleAttributes?.querySelector('i');
        const chevronAbilities = toggleAbilities?.querySelector('i');

        // Oculta as seções inicialmente (mantido do original)
        if (attributesSection) attributesSection.classList.remove('active');
        if (abilitiesSection) abilitiesSection.classList.remove('active');
        if (chevronAttributes) chevronAttributes.classList.remove('fa-chevron-up');
        if (chevronAbilities) chevronAbilities.classList.remove('fa-chevron-up');

        // Event Listener para toggle de Atributos (mantido do original)
        if (toggleAttributes) {
            toggleAttributes.addEventListener('click', function(e) {
                e.stopPropagation();
                // Fecha outras seções de atributos abertas
                document.querySelectorAll('.attributes-section').forEach(section => {
                    if (section !== attributesSection && section.classList.contains('active')) {
                        section.classList.remove('active');
                        const prevBtn = section.previousElementSibling;
                        if (prevBtn) {
                            const icon = prevBtn.querySelector('i');
                            if (icon) icon.classList.remove('fa-chevron-up');
                        }
                    }
                });
                attributesSection.classList.toggle('active');
                if (chevronAttributes) chevronAttributes.classList.toggle('fa-chevron-up');
                // Fecha a seção de habilidades se estiver aberta
                if (abilitiesSection && abilitiesSection.classList.contains('active')) {
                    abilitiesSection.classList.remove('active');
                    if (chevronAbilities) chevronAbilities.classList.remove('fa-chevron-up');
                }
            });
        }

         // Event Listener para toggle de Habilidades (mantido do original)
        if (toggleAbilities) {
            toggleAbilities.addEventListener('click', function(e) {
                e.stopPropagation();
                 // Fecha outras seções de habilidades abertas
                 document.querySelectorAll('.abilities-section').forEach(section => {
                    if (section !== abilitiesSection && section.classList.contains('active')) {
                        section.classList.remove('active');
                        const prevBtn = section.previousElementSibling;
                        if (prevBtn) {
                            const icon = prevBtn.querySelector('i');
                            if (icon) icon.classList.remove('fa-chevron-up');
                        }
                    }
                });
                abilitiesSection.classList.toggle('active');
                if (chevronAbilities) chevronAbilities.classList.toggle('fa-chevron-up');
                // Fecha a seção de atributos se estiver aberta
                if (attributesSection && attributesSection.classList.contains('active')) {
                    attributesSection.classList.remove('active');
                    if (chevronAttributes) chevronAttributes.classList.remove('fa-chevron-up');
                }
            });
        }


        // --- Lógica para atualizar e SALVAR HP/Mana/Estamina via Input ---

        const hpInput = card.querySelector('.hp-input');
        const hpFill = card.querySelector('.hp-fill');
        const hpText = card.querySelector('.hp-text');

        const manaInput = card.querySelector('.mana-input'); // Verifica se existe input de mana
        const estaminaInput = card.querySelector('.estamina-input'); // Verifica se existe input de estamina

        // Listener para HP Input
        if (hpInput && hpFill && hpText) {
            hpInput.addEventListener('input', function() {
                 updateStat(this, hpFill, hpText); // Atualiza a UI
                 saveCharacterState(card); // Salva no backend após a mudança
            });
             // Dispara a atualização inicial ao carregar (já chamado em initializeCardUI ou updateCardUI)
            // updateStat(hpInput, hpFill, hpText);
        }

        // Listener para Mana Input (se existir)
        if (manaInput) {
             const manaFill = card.querySelector('.mana-fill');
             const manaText = card.querySelector('.mana-text');
             if (manaFill && manaText) {
                 manaInput.addEventListener('input', function() {
                      updateStat(this, manaFill, manaText); // Atualiza a UI
                      saveCharacterState(card); // Salva no backend
                 });
                  // Dispara a atualização inicial ao carregar
                 // updateStat(manaInput, manaFill, manaText);
             }
        }

         // Listener para Estamina Input (se existir)
        if (estaminaInput) {
             const estaminaFill = card.querySelector('.estamina-fill');
             const estaminaText = card.querySelector('.estamina-text');
             if (estaminaFill && estaminaText) {
                 estaminaInput.addEventListener('input', function() {
                      updateStat(this, estaminaFill, estaminaText); // Atualiza a UI
                      saveCharacterState(card); // Salva no backend
                 });
                  // Dispara a atualização inicial ao carregar
                 // updateStat(estaminaInput, estaminaFill, estaminaText);
             }
        }


        // --- Lógica de Level Up, Pontos e Atributos (Adaptada para SALVAR) ---
        const levelElement = card.querySelector('.character-level');
        const pointsDisplay = card.querySelector('.remaining-points');
        const increaseLevelBtn = card.querySelector('.increase-level');
        const decreaseLevelBtn = card.querySelector('.decrease-level');
        const attributeValueElements = card.querySelectorAll('.attributes-grid .attr-value');
        const increaseAttrBtns = card.querySelectorAll('.increase-attr');
        const decreaseAttrBtns = card.querySelectorAll('.decrease-attr');

        // Listener para aumentar nível
        if (increaseLevelBtn && levelElement && pointsDisplay) {
            increaseLevelBtn.addEventListener('click', () => {
                let currentLevel = parseInt(card.dataset.level) || 0;
                let availablePoints = parseInt(card.dataset.currentPoints) || 0;

                currentLevel++;
                availablePoints += 5; // Ganha 5 pontos por nível
                card.dataset.level = currentLevel; // Atualiza o data attribute
                card.dataset.currentPoints = availablePoints; // Atualiza o data attribute
                updateLevelAndPointsDisplay(card); // Atualiza a UI
                saveCharacterState(card); // Salva no backend
                // TODO: Se HP/Mana/Estamina dependem do level, recalcular max aqui e atualizar a barra e salvar
            });
        }

        // Listener para diminuir nível
         if (decreaseLevelBtn && levelElement && pointsDisplay) {
            decreaseLevelBtn.addEventListener('click', () => {
                 let currentLevel = parseInt(card.dataset.level) || 0;
                 let availablePoints = parseInt(card.dataset.currentPoints) || 0;

                 if (currentLevel > 0) {
                    // Lógica de pontos gastos (mantida do original)
                     const initialPoints = (parseInt(card.dataset.baseLevel) || 0) * 5; // Assumindo data-baseLevel ou 0
                     const totalGainedPoints = currentLevel * 5;
                     const spentPoints = totalGainedPoints - availablePoints;


                     // Calcula quantos pontos seriam perdidos ao descer 1 nível (sempre 5)
                     const pointsLostByLevelingDown = 5;

                     // Se os pontos gastos forem maiores que os pontos ganhos no próximo nível + pontos disponíveis
                     // Isso precisa de uma lógica mais robusta dependendo de como você gerencia a distribuição de pontos base
                     // Uma verificação mais simples: O personagem tem pontos gastos que ELE NÃO TERÁ MAIS AO DESCER O NÍVEL?
                     // Ex: Level 2 (10 pts ganhos), gastou 8 (resta 2). Descer para Level 1 (5 pts ganhos).
                     // Se ele gastou 8, precisaria recuperar 3 para voltar ao estado de Level 1 com 5 pts.
                     // Se ele gastou mais pontos do que ganha ao descer o nível (5), e ele não tem pontos disponíveis suficientes para "compensar",
                     // então ele perderia pontos já alocados.
                     // Simplificando: Se availablePoints + 5 for menor que os pontos gastos que o novo level não oferece, impeça.
                     // A lógica de "pontos gastos que seriam perdidos" precisa ser refinada baseado no seu sistema.
                     // POR ENQUANTO, vamos manter a regra original que compara com `availablePoints + 5`
                     // mas a verificação de `spentPoints > availablePoints + 5` pode não ser 100% precisa
                     // dependendo de como `data-baseLevel` e distribuição inicial funcionam.
                     // Uma abordagem mais segura é: verifique se o número total de pontos gastos
                     // é maior do que o *novo* total de pontos que o personagem teria no nível anterior (currentLevel - 1) * 5.
                     const pointsAtLowerLevel = (currentLevel - 1) * 5;
                     const totalPointsSpentBeforeDecrease = (parseInt(card.dataset.level) || 0) * 5 - (parseInt(card.dataset.currentPoints) || 0);

                      if (totalPointsSpentBeforeDecrease > pointsAtLowerLevel) {
                           // Calcula quantos pontos alocados seriam perdidos
                           const pointsThatWouldBeLost = totalPointsSpentBeforeDecrease - pointsAtLowerLevel;
                           alert(`Você tem ${pointsThatWouldBeLost} pontos alocados que seriam perdidos ao diminuir o nível. Gaste pontos disponíveis ou remova pontos de atributos para descer de nível.`);
                           return; // Impede a diminuição
                      }


                    currentLevel--;
                    availablePoints -= 5; // Perde 5 pontos
                    // Garante que pontos não fiquem negativos
                    availablePoints = Math.max(0, availablePoints);

                    card.dataset.level = currentLevel; // Atualiza o data attribute
                    card.dataset.currentPoints = availablePoints; // Atualiza o data attribute
                    updateLevelAndPointsDisplay(card); // Atualiza a UI
                    saveCharacterState(card); // Salva no backend
                    // TODO: Se HP/Mana/Estamina dependem do level, recalcular max aqui e atualizar a barra e salvar
                 }
            });
        }


        // Listeners para aumentar atributos (Adaptada para SALVAR)
        increaseAttrBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const pointsDisplay = card.querySelector('.remaining-points');
                let availablePoints = parseInt(card.dataset.currentPoints) || 0;

                if (availablePoints > 0) {
                    const attrValueSpan = this.closest('.attr-value-control').querySelector('.attr-value');
                    let currentValue = parseInt(attrValueSpan.textContent) || 0;
                    currentValue++;
                    attrValueSpan.textContent = currentValue;
                    availablePoints--;
                    card.dataset.currentPoints = availablePoints; // Atualiza o data attribute
                    updateLevelAndPointsDisplay(card); // Atualiza a UI
                    saveCharacterState(card); // Salva no backend
                    // TODO: Se HP/Mana/Estamina dependem dos atributos, recalcular max aqui e atualizar a barra e salvar
                }
            });
        });

        // Listeners para diminuir atributos (Adaptada para SALVAR)
        decreaseAttrBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const attrValueSpan = this.closest('.attr-value-control').querySelector('.attr-value');
                const baseValue = parseInt(attrValueSpan.dataset.baseValue) || 0; // Pega o valor base
                let currentValue = parseInt(attrValueSpan.textContent) || 0;
                const pointsDisplay = card.querySelector('.remaining-points');
                let availablePoints = parseInt(card.dataset.currentPoints) || 0;


                if (currentValue > baseValue) { // Só pode diminuir até o valor base
                    currentValue--;
                    attrValueSpan.textContent = currentValue;
                    availablePoints++;
                    card.dataset.currentPoints = availablePoints; // Atualiza o data attribute
                    updateLevelAndPointsDisplay(card); // Atualiza a UI
                    saveCharacterState(card); // Salva no backend
                     // TODO: Se HP/Mana/Estamina dependem dos atributos, recalcular max aqui e atualizar a barra e salvar
                }
            });
        });


        // --- Lógica de Filtros (mantida do original) ---
        // (Código dos filtros permanece o mesmo)

        // --- Efeito Hover (mantido do original) ---
        // (Código do hover permanece o mesmo)

         // --- Lógica do Modal de Edição (mantida do original) ---
         // Note: O modal de edição ainda não está integrado com o backend.
         // Se você for usá-lo para editar stats/atributos, precisará adaptar
         // a lógica do modal para chamar saveCharacterState após salvar as edições.
         // Por enquanto, ele não afeta o salvamento no backend.

        // --- Inicialização (Partes já tratadas por loadCharacterState ou updateCardUI/initializeCardUI) ---
        // A inicialização do display de level/pontos e das barras de stats
        // agora acontece dentro de loadCharacterState ou initializeCardUI.

         // Inicializa o data-base-value para cada atributo se não existir (mantido do original)
        attributeValueElements.forEach(attrValueSpan => {
            if (!attrValueSpan.dataset.baseValue) {
                attrValueSpan.dataset.baseValue = parseInt(attrValueSpan.textContent) || 0;
            }
        });

    }); // Fim do loop characterCards.forEach


    // --- Código de filtros e efeitos globais (mantido do original, fora do loop de cards) ---
    // Seleciona e gerencia os filtros
    const searchInput = document.querySelector('.search-input');
    const filterSelect = document.querySelector('.filter-select');

    function filterCharacters() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedRace = filterSelect ? filterSelect.value : 'all';
        const characterCards = document.querySelectorAll('.character-card'); // Seleciona novamente dentro da função

        characterCards.forEach(card => {
            const characterName = card.querySelector('h2').textContent.toLowerCase();
            const cardRace = card.dataset.race;

            const matchesSearch = characterName.includes(searchTerm);
            const matchesRace = (selectedRace === 'all' || cardRace === selectedRace);

            if (matchesSearch && matchesRace) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

     // Adiciona listeners APENAS SE os elementos de filtro existirem
     if (searchInput) {
        searchInput.addEventListener('input', filterCharacters);
     }

     if (filterSelect) {
        filterSelect.addEventListener('change', filterCharacters);
     }


     // Efeito fade-in no body (mantido do original)
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);

    // Efeito de brilho no toggle-btn (mantido do original)
    // Este listener já está no forEach do card, vamos mantê-lo lá para ser aplicado por card
    // document.querySelectorAll('.toggle-btn').forEach(button => { ... });

     // Lógica de fechar modal global (mantida do original)
     // Certifique-se que o elemento '.modal' ou '.close-modal' exista no seu HTML do modal
     document.querySelectorAll('.close-modal, .modal').forEach(el => {
         el.addEventListener('click', function(e) {
             // Fecha apenas se clicar no background do modal ou no elemento com classe 'close-modal'
             if (e.target === this || e.target.classList.contains('close-modal')) {
                 const modal = document.getElementById('edit-modal'); // Certifique-se que o modal existe no HTML
                 if (modal) modal.style.display = 'none';
             }
         });
     });

    // Adiciona o link para o dashboard na sidebar em todos os links que contêm 'PAINEL'
    // Verifique se os links na sidebar existem na página atual antes de tentar modificá-los
    document.querySelectorAll('.sidebar-nav ul li a').forEach(link => {
        if (link.textContent.includes('PAINEL')) {
            link.href = 'dashboard.html'; // Define o href para a página do dashboard
        }
        // Outros links da sidebar (INÍCIO, MONSTROS, etc.)
        if (link.textContent.includes('INÍCIO')) {
             link.href = 'index.html'; // Ou qual for sua página inicial
        }
         if (link.textContent.includes('MONSTROS')) {
              link.href = 'monstro.html'; // Link para a página de monstros
         }
         if (link.textContent.includes('HISTÓRIA')) {
             link.href = 'historia.html'; // Link para a página de história
         }
         // Adicione outros links da sidebar conforme necessário
    });

}); // Fim do DOMContentLoaded