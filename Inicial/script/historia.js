document.addEventListener('DOMContentLoaded', function() {

    // --- Elementos do Modal ---
    const storyModal = document.getElementById('story-modal');
    const modalTitle = document.getElementById('modal-title');
    const storyForm = document.getElementById('story-form');
    const storyIdInput = document.getElementById('story-id');
    const segmentTitleInput = document.getElementById('story-segment-title');
    const segmentParagraphInput = document.getElementById('story-segment-paragraph');
    const saveStoryBtn = document.getElementById('save-story-btn');
    const cancelStoryBtn = document.getElementById('cancel-story-btn');
    const closeModalBtn = storyModal?.querySelector('.close-modal'); // Botão fechar no header do modal

    // --- Botões da Página e Contêineres ---
    const addStorySegmentBtn = document.querySelector('.add-story-segment-btn');
    const storyContainer = document.querySelector('.story-container'); // Contêiner principal da história
    const addSegmentContainer = document.querySelector('.add-segment-container'); // Contêiner do botão adicionar

    // --- Event Listeners para os botões da página ---

    // Listener para o botão "Adicionar Novo Segmento"
    if (addStorySegmentBtn) {
        addStorySegmentBtn.addEventListener('click', function() {
            openModal(); // Abre o modal para adicionar um novo segmento
        });
    }

    // Listeners para os botões "Editar" e "Excluir" (delegação de eventos)
    // É mais eficiente adicionar um listener no contêiner pai (story-container)
    // e verificar qual botão foi clicado. Isso funciona mesmo para segmentos adicionados dinamicamente.
    if (storyContainer) {
        storyContainer.addEventListener('click', function(event) {
            const target = event.target;

            // Verifica se o clique foi em um botão de Editar ou seu ícone
            const editBtn = target.closest('.edit-story-btn');
            if (editBtn) {
                // Previne a ação padrão do botão (ex: navegar se fosse um link)
                event.preventDefault();
                const segmentId = editBtn.dataset.id;
                openModal(segmentId); // Abre o modal no modo edição
                return; // Sai para evitar que outros listeners no mesmo clique disparem
            }

            // Verifica se o clique foi em um botão de Excluir ou seu ícone
            const deleteBtn = target.closest('.delete-story-btn');
            if (deleteBtn) {
                 // Previne a ação padrão do botão
                event.preventDefault();
                const segmentId = deleteBtn.dataset.id;
                deleteSegment(segmentId); // Chama a função para excluir
                return; // Sai
            }
             // Adicionado clique no botão de adicionar, caso ele seja incluído dinamicamente
             const addBtn = target.closest('.add-story-segment-btn');
             if(addBtn) {
                  event.preventDefault();
                  openModal();
             }
        });
    }


    // --- Funções do Modal ---

    // Função para abrir o modal (para adicionar ou editar)
    function openModal(segmentId = null) {
        if (!storyModal) {
            console.error("Elemento modal não encontrado!");
            return; // Verifica se o modal existe
        }

        storyForm.reset(); // Limpa o formulário
        storyIdInput.value = ''; // Garante que o ID esteja limpo por padrão

        if (segmentId) {
            // Modo Edição
            modalTitle.textContent = 'Editar Segmento da História';
            saveStoryBtn.textContent = 'Salvar Alterações';
            // Encontra o segmento existente e preenche o formulário
            const segment = document.querySelector(`.story-segment[data-id="${segmentId}"]`);
            if (segment) {
                storyIdInput.value = segmentId; // Salva o ID no campo oculto
                // Certifica-se de pegar o texto corretamente, ignorando HTML extra
                segmentTitleInput.value = segment.querySelector('.story-title')?.textContent.trim() || '';
                segmentParagraphInput.value = segment.querySelector('.story-paragraph')?.textContent.trim() || '';
            } else {
                console.error(`Segmento com ID "${segmentId}" não encontrado.`);
                // Opcional: Mostrar um erro para o usuário
                return; // Não abre o modal se o segmento não for encontrado
            }
        } else {
            // Modo Adição
            modalTitle.textContent = 'Adicionar Novo Segmento';
            saveStoryBtn.textContent = 'Adicionar Segmento';
            // storyIdInput.value já está vazio
        }

        storyModal.style.display = 'flex'; // Mostra o modal (usando flex para centralizar)
    }

    // Função para fechar o modal
    function closeModal() {
         if (storyModal) {
            storyModal.style.display = 'none';
            storyForm.reset(); // Limpa o formulário ao fechar
            storyIdInput.value = ''; // Garante que o ID esteja limpo
         }
    }

    // Listener para fechar o modal clicando no X
    if (closeModalBtn) {
         closeModalBtn.addEventListener('click', closeModal);
    }

    // Listener para fechar o modal clicando fora dele
    if (storyModal) {
        storyModal.addEventListener('click', function(event) {
             // Se o clique foi no overlay (o próprio modal-overlay), feche
             if (event.target === storyModal) {
                 closeModal();
             }
        });
    }

    // Listener para o botão Cancelar no modal
    if (cancelStoryBtn) {
        cancelStoryBtn.addEventListener('click', closeModal);
    }

    // Listener para o envio do formulário (Salvar)
    if (storyForm) {
        storyForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Previne o recarregamento da página

            const segmentId = storyIdInput.value;
            const title = segmentTitleInput.value.trim();
            const paragraph = segmentParagraphInput.value.trim();

            if (!title || !paragraph) {
                alert('Por favor, preencha o título e o conteúdo do segmento.');
                return;
            }

            if (segmentId) {
                // Lógica para Editar Segmento
                updateSegment(segmentId, title, paragraph);
            } else {
                // Lógica para Adicionar Novo Segmento
                addSegment(title, paragraph);
            }

            closeModal(); // Fecha o modal após salvar
        });
    }

    // --- Funções de CRUD (Adicionar, Editar, Excluir) ---

    // Função para Adicionar um novo segmento
    function addSegment(title, paragraph) {
        // Gera um ID único simples (timestamp + número aleatório)
        const newId = `segment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Cria o HTML para o novo segmento
        // Usamos textContent no lugar de innerHTML para setar o texto de forma segura
        const newSegmentDiv = document.createElement('div');
        newSegmentDiv.classList.add('story-segment');
        newSegmentDiv.dataset.id = newId;

        newSegmentDiv.innerHTML = `
             <h3 class="story-title"></h3>
             <p class="story-paragraph"></p>
             <div class="story-actions">
                 <button class="edit-story-btn pixel-button small" data-id="${newId}"><i class="fas fa-edit"></i> Editar</button>
                 <button class="delete-story-btn pixel-button small secondary" data-id="${newId}"><i class="fas fa-trash-alt"></i> Excluir</button>
             </div>
         `;

        // Agora setamos o texto de forma segura
        newSegmentDiv.querySelector('.story-title').textContent = title;
        newSegmentDiv.querySelector('.story-paragraph').textContent = paragraph;


        // Encontra o contêiner onde o novo segmento deve ser inserido.
        // Queremos inseri-lo antes do contêiner do botão adicionar.
        if (addSegmentContainer && storyContainer) {
            storyContainer.insertBefore(newSegmentDiv, addSegmentContainer);
        } else if (storyContainer) {
            // Se o contêiner do botão não for encontrado (o que não deveria acontecer com o HTML fornecido),
            // apenas adicione ao final do storyContainer.
             storyContainer.appendChild(newSegmentDiv);
        } else {
            console.error("Não foi possível encontrar o contêiner da história ou do botão adicionar.");
        }


        console.log(`Segmento adicionado: ${title}`);
        // Opcional: Feedback para o usuário (ex: toast message)
        // alert('Segmento da história adicionado!');
    }

    // Função para Editar um segmento existente
    function updateSegment(segmentId, title, paragraph) {
        const segment = document.querySelector(`.story-segment[data-id="${segmentId}"]`);
        if (segment) {
            // Usamos textContent para setar o texto de forma segura
            segment.querySelector('.story-title').textContent = title;
            segment.querySelector('.story-paragraph').textContent = paragraph;
            console.log(`Segmento atualizado: ${segmentId}`);
            // Opcional: Feedback para o usuário
            // alert('Segmento da história atualizado!');
        } else {
            console.error(`Erro ao atualizar: Segmento com ID "${segmentId}" não encontrado.`);
        }
    }

    // Função para Excluir um segmento
    function deleteSegment(segmentId) {
        // Adiciona uma confirmação antes de excluir
        if (confirm('Tem certeza que deseja excluir este segmento da história?')) {
            const segment = document.querySelector(`.story-segment[data-id="${segmentId}"]`);
            if (segment) {
                segment.remove(); // Remove o elemento do DOM
                console.log(`Segmento excluído: ${segmentId}`);
                 // Opcional: Feedback para o usuário
                 // alert('Segmento da história excluído.');
            } else {
                console.error(`Erro ao excluir: Segmento com ID "${segmentId}" não encontrado.`);
            }
        }
    }


    // --- Lógica de Inicialização (mantida do original ou ajustada) ---

    // Efeito fade-in no body (mantido do original)
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);

     // (Outras lógicas de inicialização ou efeitos visuais, se houver, podem ser adicionadas aqui)

});