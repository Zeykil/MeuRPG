document.addEventListener('DOMContentLoaded', function() {
    // URL base do seu backend Flask (ajuste se necessário)
    const API_BASE_URL = 'http://127.0.0.1:5000/api';

    // --- Referências aos Elementos HTML ---
    const characterSelect = document.getElementById('character-select');
    const displayFor = document.getElementById('display-for');
    const displayRes = document.getElementById('display-res');
    const displayEsp = document.getElementById('display-esp');

    // Referências aos elementos de cálculo de HP Base
    const calculateHpButton = document.querySelector('.calculate-hp-button'); // Agora usando este botão
    const calculatedHpSpan = document.getElementById('calculated-hp'); // Onde exibir o resultado

    const diceImages = document.querySelectorAll('.dice-image');
    const numDiceInput = document.getElementById('num-dice');
    const diceModifierInput = document.getElementById('dice-modifier');
    const rollDiceButton = document.querySelector('.roll-dice-button');
    const lastRollSpan = document.getElementById('last-roll');
    const rollDetailsDiv = document.getElementById('roll-details');
    const rollHistoryListSpan = document.getElementById('roll-history-list'); // Span para exibir histórico


    const drCalcResInput = document.getElementById('dr-calc-res');
    const drCalcDanoInput = document.getElementById('dr-calc-dano');
    const calculateDrButton = document.querySelector('.calculate-dr-button');
    const calculatedDrSpan = document.getElementById('calculated-dr');


    // --- Variáveis de Estado ---
    let selectedDiceValue = 20;
    let rollHistory = []; // Array que vai guardar o histórico do DB
    // Mantido para exibir atributos E USAR NO CÁLCULO DE HP
    let displayedCharacterStats = { for: 0, res: 0, esp: 0 };
    let selectedCharacterId = null; // Armazena o ID do personagem selecionado


    // --- Funções de Comunicação com o Backend ---

    async function fetchCharacters() {
        console.log(`Tentando buscar personagens do backend em: ${API_BASE_URL}/personagens`); // Log para debug
        try {
            const response = await fetch(`${API_BASE_URL}/personagens`);

            if (response.ok) {
                const characters = await response.json();
                console.log('Personagens carregados do backend com sucesso:', characters); // Log de sucesso com os dados
                // Verifica se a lista de personagens não está vazia antes de popular
                if (characters && characters.length > 0) { // Adição de verificação
                    populateCharacterSelect(characters);
                } else {
                     console.log("Backend retornou lista vazia. Não há personagens para exibir."); // Log para caso de lista vazia
                     populateCharacterSelect([]); // Popula com lista vazia para limpar opções antigas se houver
                }

            } else {
                console.error('Erro ao carregar lista de personagens:', response.status, response.statusText); // Log de erro HTTP
                 populateCharacterSelect([]); // Popula com lista vazia em caso de erro
            }
        } catch (error) {
            console.error('Erro na comunicação com o backend ao listar personagens:', error); // Log de erro de conexão
             populateCharacterSelect([]); // Popula com lista vazia em caso de erro
        }
    }

    async function fetchCharacterStats(characterId) {
        if (!characterId) {
            displayFor.textContent = '--';
            displayRes.textContent = '--';
            displayEsp.textContent = '--';
            displayedCharacterStats = { for: 0, res: 0, esp: 0 }; // Limpa os stats no estado
            calculatedHpSpan.textContent = '?'; // Limpa o HP calculado quando nenhum personagem é selecionado
            selectedCharacterId = null;
            rollHistory = []; // Limpa o histórico visual
            updateRollHistoryDisplay(); // Atualiza a exibição
            // Se nenhum personagem, busca histórico global recente
             fetchAndDisplayRollHistory(null);
            return;
        }
        console.log(`Tentando buscar stats do personagem ${characterId} em: ${API_BASE_URL}/personagem/${characterId}`); // Log para debug

        try {
            const response = await fetch(`${API_BASE_URL}/personagem/${characterId}`);
            if (response.ok) {
                const character = await response.json();
                console.log(`Dados do personagem ${characterId} carregados:`, character);

                // Usa os nomes das chaves do backend (schema.sql)
                const characterFor = character.for_attr || 0;
                const characterRes = character.res_attr || 0;
                const characterEsp = character.esp_attr || 0;

                displayFor.textContent = characterFor;
                displayRes.textContent = characterRes;
                displayEsp.textContent = characterEsp;

                // ATUALIZA A VARIÁVEL DE ESTADO COM OS ATRIBUTOS CARREGADOS
                displayedCharacterStats = { for: characterFor, res: characterRes, esp: characterEsp };

                selectedCharacterId = characterId; // Armazena o ID do personagem carregado

                 // Opcional: Calcular HP automaticamente ao carregar os stats do personagem
                 // calculateHp();


                // Busca o histórico de rolagens para o personagem selecionado
                fetchAndDisplayRollHistory(characterId);


            } else if (response.status === 404) {
                console.warn(`Personagem ${characterId} não encontrado no backend.`);
                displayFor.textContent = '--';
                displayRes.textContent = '--';
                displayEsp.textContent = '--';
                displayedCharacterStats = { for: 0, res: 0, esp: 0 }; // Limpa os stats no estado
                 calculatedHpSpan.textContent = '?'; // Limpa o HP calculado
                selectedCharacterId = null;
                 rollHistory = []; // Limpa o histórico visual
                 updateRollHistoryDisplay(); // Atualiza a exibição
                 // Se personagem não encontrado, busca histórico global recente
                 fetchAndDisplayRollHistory(null);

            } else {
                console.error(`Erro ao carregar dados do personagem ${characterId}:`, response.status, response.statusText);
                displayFor.textContent = '--';
                displayRes.textContent = '--';
                displayEsp.textContent = '--';
                displayedCharacterStats = { for: 0, res: 0, esp: 0 }; // Limpa os stats no estado
                 calculatedHpSpan.textContent = '?'; // Limpa o HP calculado
                selectedCharacterId = null;
                 rollHistory = []; // Limpa o histórico visual
                 updateRollHistoryDisplay(); // Atualiza a exibição
                 // Em caso de erro, busca histórico global recente
                 fetchAndDisplayRollHistory(null);
            }
        } catch (error) {
            console.error(`Erro na comunicação com o backend ao carregar ${characterId}:`, error);
            displayFor.textContent = '--';
            displayRes.textContent = '--';
            displayEsp.textContent = '--';
            displayedCharacterStats = { for: 0, res: 0, esp: 0 }; // Limpa os stats no estado
             calculatedHpSpan.textContent = '?'; // Limpa o HP calculado
            selectedCharacterId = null;
             rollHistory = []; // Limpa o histórico visual
             updateRollHistoryDisplay(); // Atualiza a exibição
              // Em caso de erro de conexão, busca histórico global recente
             fetchAndDisplayRollHistory(null);
        }
    }


    // --- Funções de Lógica da Aplicação ---

    // Função para calcular o HP Base
    function calculateHp() {
        // Usa os atributos armazenados na variável de estado
        const forAttr = displayedCharacterStats.for;
        const resAttr = displayedCharacterStats.res;
        const espAttr = displayedCharacterStats.esp;

        // Implementa a fórmula: HP Base = (FOR × 2) + (RES × 3) + (ESP × 1)
        const hpBase = (forAttr * 2) + (resAttr * 3) + (espAttr * 1);

        // Exibe o resultado
        if (calculatedHpSpan) {
            calculatedHpSpan.textContent = hpBase;
        }

        console.log(`HP Base calculado: (FOR=${forAttr}*2) + (RES=${resAttr}*3) + (ESP=${espAttr}*1) = ${hpBase}`);
    }


    // Função para salvar uma entrada de rolagem no backend
    async function saveRollHistoryEntry(rollDetails, rollResult, characterId = null) {
        // ... (esta função permanece igual) ...
         try {
            const response = await fetch(`${API_BASE_URL}/rpg/roll_history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    character_id: characterId,
                    roll_details: rollDetails,
                    roll_result: rollResult
                })
            });

            if (response.ok) {
                console.log('Entrada de histórico de rolagem salva no backend!');
                // Após salvar, recarregar o histórico para exibir a nova entrada
                 // Se um personagem está selecionado, recarrega o histórico dele
                 if (selectedCharacterId) {
                    fetchAndDisplayRollHistory(selectedCharacterId);
                 } else {
                    // Caso contrário, recarrega o histórico global recente
                     fetchAndDisplayRollHistory(null);
                 }

            } else {
                 const errorText = await response.text();
                console.error('Erro ao salvar entrada de histórico:', response.status, response.statusText, errorText);
            }
        } catch (error) {
            console.error('Erro na comunicação ao tentar salvar histórico:', error);
        }
    }

     // Função para buscar e exibir o histórico de rolagens
     async function fetchAndDisplayRollHistory(characterId = null) {
         // ... (esta função permanece igual) ...
         try {
             let url;
             if (characterId) {
                 url = `${API_BASE_URL}/rpg/roll_history/${characterId}`;
             } else {
                 url = `${API_BASE_URL}/rpg/roll_history`; // Rota para histórico global recente
             }
             console.log(`Tentando buscar histórico em: ${url}`); // Log para debug

             const response = await fetch(url);

             if (response.ok) {
                 const historyData = await response.json();
                 console.log(`Histórico de rolagens carregado (${characterId ? 'personagem' : 'global'}):`, historyData);

                 // Atualiza o array rollHistory com os dados do backend
                 rollHistory = historyData.map(entry => {
                      // Formata a exibição da entrada do histórico
                      const timestamp = new Date(entry.timestamp).toLocaleTimeString(); // Formata a hora
                      return `${entry.roll_details} [${timestamp}]`;
                 });

                 // Exibe o histórico atualizado
                 updateRollHistoryDisplay();

             } else if (response.status === 404 && characterId) {
                  console.warn(`Histórico não encontrado para o personagem ${characterId}.`);
                  rollHistory = []; // Limpa o histórico se não encontrar para o personagem
                  updateRollHistoryDisplay();
             }
             else {
                 console.error(`Erro ao carregar histórico de rolagens (${characterId ? 'personagem ' + characterId : 'global'}):`, response.status, response.statusText);
                 rollHistory = []; // Limpa o histórico em caso de erro
                 updateRollHistoryDisplay();
             }

         } catch (error) {
             console.error('Erro na comunicação ao tentar carregar histórico:', error);
             rollHistory = []; // Limpa o histórico em caso de erro de conexão
             updateRollHistoryDisplay();
         }
     }

     // Função para atualizar a exibição do histórico no HTML
     function updateRollHistoryDisplay() {
         // ... (esta função permanece igual) ...
          if (rollHistoryListSpan) {
             // Junta as entradas com quebra de linha para exibição
             rollHistoryListSpan.textContent = rollHistory.join('\n');
             // Nota: Para que o '\n' apareça como quebra de linha no HTML,
             // o CSS do #roll-history-list precisa ter `white-space: pre-wrap;`
         }
     }


    // --- Funções de Lógica da Aplicação (Continuação) ---

    function populateCharacterSelect(characters) {
        // Limpa as opções existentes, mantendo a opção padrão
        characterSelect.innerHTML = '<option value="">-- Selecione um Personagem --</option>';

        if (characters && characters.length > 0) {
            characters.forEach(character => {
                const option = document.createElement('option');
                option.value = character.id;
                // Assume que o backend retorna um objeto com 'id'.
                // Se o backend retornar um nome, use character.name aqui.
                // Ex: option.textContent = character.name || character.id;
                 option.textContent = character.id; // Usando o ID como texto da opção por enquanto
                characterSelect.appendChild(option);
            });
        } else {
            console.log("Nenhum personagem retornado do backend para preencher o dropdown."); // Log se a lista estiver vazia
             // A opção padrão "Selecione um Personagem" já está presente
        }
    }

    function rollDice() {
        const numDice = parseInt(numDiceInput.value || '1') || 1; // Pega valor do input, padrão 1
        const diceType = selectedDiceValue;
        const modifier = parseInt(diceModifierInput.value || '0') || 0; // Pega valor do input, padrão 0

        let totalRoll = 0;
        let rollResults = [];

        if (numDice <= 0 || diceType <= 0) {
            lastRollSpan.textContent = "Erro!";
            rollDetailsDiv.textContent = "Quantidade ou Tipo de Dado inválido.";
             // Não salva no histórico se a rolagem for inválida
            return;
        }

        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * diceType) + 1;
            totalRoll += roll;
            rollResults.push(roll);
        }

        const finalResult = totalRoll + modifier;

        lastRollSpan.textContent = finalResult;

        let details = `${numDice}d${diceType}`;
        if (modifier > 0) details += ` + ${modifier}`;
        if (modifier < 0) details += ` ${modifier}`; // Usa o sinal correto para negativo

        let detailsForHistory = details; // Guarda a string formatada para o histórico

        if (numDice > 1 || modifier !== 0) {
             // Mostra os resultados individuais se houver mais de um dado ou modificador
             details += ` = (${rollResults.join(' + ')})`; // Espaço para melhor leitura
             if (modifier !== 0) details += ` ${modifier > 0 ? '+' : ''} ${modifier}`; // Ajustado para não repetir o + para positivo
             details += ` = ${finalResult}`;
        } else {
             // Se for 1 dado sem modificador
             details = `${numDice}d${diceType} = ${finalResult}`; // Mostra 1dX = Resultado
             // detailsForHistory é o mesmo aqui
        }

        rollDetailsDiv.textContent = details;

        // Salva a rolagem no backend
        saveRollHistoryEntry(detailsForHistory, finalResult, selectedCharacterId); // Usa detailsForHistory, resultado e characterId
    }

    function calculateDamageReduction() {
        const resistance = parseInt(drCalcResInput.value || '0') || 0; // Pega valor do input, padrão 0
        const damageReceived = parseInt(drCalcDanoInput.value || '0') || 0; // Pega valor do input, padrão 0

        let reduction = 0;
        let factor = 0;

        if (damageReceived <= 0) {
             calculatedDrSpan.textContent = "0"; // Redução é 0 se não há dano
            console.log(`Cálculo Redução Dano: Dano recebido 0. Redução = 0.`);
            return;
        }
         // Evita divisão por zero no cálculo do fator
        if (resistance >= 0 && damageReceived > 0) { // Garante resistência não negativa e dano positivo
             factor = resistance / damageReceived;
        } else if (resistance < 0 && damageReceived > 0) {
            factor = -Math.abs(resistance) / damageReceived; // Trata resistência negativa se aplicável
        }
         else if (damageReceived === 0) {
            factor = Infinity; // Ou trate como sua regra dita
         } else {
             factor = 0; // Default para outros casos
         }


        // Aplica as regras de redução
        // Esta lógica pode precisar ser ajustada de acordo com as REGRAS REAIS do seu RPG!
        if (factor > 1.3) {
             // Exemplo de regra: Redução = DANO / Fator se fator alto
             reduction = damageReceived / factor;

        } else if (factor >= 0.7 && factor <= 1.3) { // Fator entre 0.7 e 1.3 (ajustado do código anterior)
             // Exemplo de regra: Redução = 60% do DANO
             reduction = damageReceived * 0.60;

        } else if (factor >= 0 && factor < 0.7) { // Fator entre 0 e 0.7
            // Exemplo de regra: Redução = DANO * 0.40 * Fator
            reduction = damageReceived * 0.40 * factor;

        } else if (factor < 0) { // Fator negativo (resistência negativa vs dano positivo)
             // Exemplo: Resistência negativa Aumenta o dano. Não reduz.
             reduction = 0; // Ou calcule aumento de dano se for a regra.

        }
         else { // Outros casos não previstos
            reduction = 0;
        }

        // Garante que a redução não seja menor que zero nem maior que o dano recebido
        reduction = Math.max(0, Math.min(reduction, damageReceived));


        // Exibe o resultado da REDUÇÃO aplicada
        // É comum arredondar resultados de dano/redução para inteiros
        calculatedDrSpan.textContent = Math.round(reduction);

        console.log(`Cálculo Redução Dano: RES=${resistance}, DANO=${damageReceived}, Fator=${factor.toFixed(2)}, Redução calculada=${reduction.toFixed(2)}, Redução exibida=${calculatedDrSpan.textContent}`); // Para debug
    }


    // --- Inicialização e Adição de Listeners ---

    // 1. Carregar a lista de personagens ao carregar a página
    fetchCharacters(); // Chama a função para buscar e popular o dropdown

    // Carrega o histórico de rolagens global recente ao carregar a página
     fetchAndDisplayRollHistory(null); // Passa null para buscar histórico global

    // 2. Adicionar listener para o dropdown de seleção de personagem
    if (characterSelect) {
        characterSelect.addEventListener('change', function() {
            const selectedCharacterId = this.value; // Pega o ID do personagem selecionado
            fetchCharacterStats(selectedCharacterId); // Busca os stats do personagem (isso aciona a busca de histórico para o personagem)

             // Se um personagem é selecionado, fetchCharacterStats vai cuidar de carregar o histórico dele.
             // Se "-- Selecione um Personagem --" é selecionado (value=""), selectedCharacterId será vazio.
             // fetchCharacterStats lida com characterId vazio, limpando stats e buscando histórico global.

        });
    }


     // ADICIONAR LISTENER PARA O BOTÃO CALCULAR HP BASE
    if (calculateHpButton) {
        calculateHpButton.addEventListener('click', function() {
            calculateHp(); // Chama a função de cálculo de HP quando o botão é clicado
        });
    }


    // 4. Adicionar listeners para as imagens dos dados (seleção)
    diceImages.forEach(image => {
        image.addEventListener('click', function() {
            diceImages.forEach(img => img.classList.remove('selected'));
            this.classList.add('selected');
            selectedDiceValue = parseInt(this.dataset.value || '20') || 20; // Pega do data-value, padrão 20
            console.log('Dado selecionado:', selectedDiceValue);
        });
    });

    // 5. Adicionar listener para o botão Rolar Dados
    if (rollDiceButton) {
        rollDiceButton.addEventListener('click', function() {
            rollDice(); // Esta função agora salva no backend
        });
    }
     if (numDiceInput) {
         numDiceInput.addEventListener('keypress', function(event) {
             if (event.key === 'Enter') {
                  event.preventDefault();
                 rollDice();
             }
         });
     }
      if (diceModifierInput) {
         diceModifierInput.addEventListener('keypress', function(event) {
             if (event.key === 'Enter') {
                  event.preventDefault();
                 rollDice();
             }
         });
     }


    // 6. Adicionar listener para o botão Calcular Redução de Dano
    if (calculateDrButton) {
        calculateDrButton.addEventListener('click', function() {
            calculateDamageReduction();
        });
    }
     if (drCalcResInput) {
         drCalcResInput.addEventListener('keypress', function(event) {
             if (event.key === 'Enter') {
                  event.preventDefault();
                 calculateDamageReduction();
             }
         });
     }
      if (drCalcDanoInput) {
         drCalcDanoInput.addEventListener('keypress', function(event) {
             if (event.key === 'Enter') {
                  event.preventDefault();
                 calculateDamageReduction();
             }
         });
     }


    // 7. Lógica de Efeito Fade-in (mantida)
     setTimeout(() => {
         document.body.style.opacity = '1';
     }, 100);

     // 8. Lógica de links da Sidebar (mantida)
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
           if (link.textContent.includes('MAPA')) { // Adicionado link para a página do mapa
              link.href = 'mapa.html';
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
           if (link.textContent.includes('SALA DE RPG')) {
              link.href = 'rpg.html';
         }
     });

}); // Fim do DOMContentLoaded