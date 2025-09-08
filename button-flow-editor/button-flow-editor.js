// Variables globales pour l'intégration Grist
let allRecords = [];

// ================================================================================
// SECTION: INTÉGRATION GRIST (utilise /shared/grist-connector.js)
// ================================================================================

/**
 * Override la fonction onRecords du grist-connector pour notre usage spécifique
 */
function onRecords(records, mappings) {
    allRecords = records || [];
    console.log(`${allRecords.length} enregistrements reçus pour la sélection dynamique`);
    
    // Mettre à jour l'affichage des requêtes
    updateQueriesDisplay();
}

/**
 * Met à jour l'affichage des requêtes disponibles
 */
function updateQueriesDisplay() {
    const loadingMessage = document.getElementById('loading-message');
    const queriesContainer = document.getElementById('queries-container');
    const noQueriesMessage = document.getElementById('no-queries-message');
    
    if (!loadingMessage || !queriesContainer || !noQueriesMessage) {
        console.error('Éléments DOM manquants pour updateQueriesDisplay');
        return;
    }
    
    loadingMessage.classList.add('hidden');
    
    if (allRecords.length === 0) {
        noQueriesMessage.classList.remove('hidden');
        queriesContainer.classList.add('hidden');
        return;
    }
    
    noQueriesMessage.classList.add('hidden');
    queriesContainer.classList.remove('hidden');
    queriesContainer.innerHTML = '';
    
    allRecords.forEach((record, index) => {
        // Utilise requestNameField du grist-connector
        const queryName = record[requestNameField] || `Requête ${index + 1}`;
        
        const queryElement = document.createElement('div');
        queryElement.className = 'draggable-item bg-gray-100 p-4 rounded-lg flex items-center justify-between hover:bg-gray-200 transition-colors';
        queryElement.draggable = true;
        queryElement.id = `query-${record.id || index}`;
        
        queryElement.innerHTML = `
            <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-800 truncate">${queryName}</p>
            </div>
            <span class="material-icons text-gray-400 ml-2 flex-shrink-0">drag_indicator</span>
        `;
        
        queriesContainer.appendChild(queryElement);
    });
    
    // Réinitialiser les event listeners
    initializeDragAndDrop();
}

// ================================================================================
// SECTION: DRAG & DROP
// ================================================================================

let initialPlaceholder;

function initializeDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable-item');
    const dropzone = document.getElementById('dropzone');
    
    if (!dropzone) return;
    
    if (!initialPlaceholder) {
        initialPlaceholder = dropzone.innerHTML;
    }
    
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.id);
            e.target.classList.add('opacity-50');
        });
        
        draggable.addEventListener('dragend', (e) => {
            e.target.classList.remove('opacity-50');
        });
    });
    
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('bg-teal-50', 'border-teal-400');
    });
    
    dropzone.addEventListener('dragleave', (e) => {
        if (!dropzone.contains(e.relatedTarget)) {
            dropzone.classList.remove('bg-teal-50', 'border-teal-400');
        }
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('bg-teal-50', 'border-teal-400');
        
        if (dropzone.querySelector('p.text-center')) {
            dropzone.innerHTML = '';
        }
        
        const id = e.dataTransfer.getData('text/plain');
        const draggableElement = document.getElementById(id);
        
        if (!draggableElement) return;
        
        const clone = draggableElement.cloneNode(true);
        clone.classList.remove('draggable-item', 'bg-gray-100', 'hover:bg-gray-200');
        clone.classList.add('bg-white', 'shadow-sm', 'mb-3', 'border');
        clone.removeAttribute('draggable');
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<span class="material-icons text-red-500 hover:text-red-700">delete</span>';
        deleteBtn.classList.add('ml-auto', 'flex-shrink-0');
        deleteBtn.onclick = () => {
            clone.remove();
            if (dropzone.children.length === 0) {
                dropzone.innerHTML = initialPlaceholder;
            } else {
                updateConnectors();
            }
        };
        
        const dragIcon = clone.querySelector('.material-icons');
        if (dragIcon) {
            dragIcon.replaceWith(deleteBtn);
        }
        
        dropzone.appendChild(clone);
        updateConnectors();
    });
}

function updateConnectors() {
    const dropzone = document.getElementById('dropzone');
    if (!dropzone) return;
    
    const items = dropzone.querySelectorAll('.bg-white');
    
    // Supprimer les connecteurs existants
    dropzone.querySelectorAll('.connector').forEach(c => c.remove());
    
    items.forEach((item, index) => {
        if (index < items.length - 1) {
            const connector = document.createElement('div');
            connector.classList.add('connector', 'flex', 'justify-center', 'items-center', 'h-8', 'my-[-0.5rem]');
            connector.innerHTML = '<span class="material-icons text-gray-400">arrow_downward</span>';
            item.after(connector);
        }
    });
}

// ================================================================================
// SECTION: GESTION DU BOUTON "CRÉER"
// ================================================================================

function handleCreateButton() {
    const buttonName = document.getElementById('button-name').value.trim();
    const dropzone = document.getElementById('dropzone');
    
    if (!dropzone) return;
    
    const selectedQueries = Array.from(dropzone.querySelectorAll('.bg-white')).map(item => {
        return item.querySelector('p').textContent;
    });
    
    if (!buttonName) {
        alert('Veuillez saisir un nom pour le bouton');
        return;
    }
    
    if (selectedQueries.length === 0) {
        alert('Veuillez sélectionner au moins une requête');
        return;
    }
    
    console.log('Création du bouton:', {
        name: buttonName,
        queries: selectedQueries
    });
    
    alert(`Bouton "${buttonName}" créé avec ${selectedQueries.length} requête(s):\n${selectedQueries.join('\n')}`);
}

// ================================================================================
// SECTION: INITIALISATION
// ================================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Attendre que le grist-connector soit chargé
    setTimeout(() => {
        // Le grist-connector.js va automatiquement appeler configureGristSettings()
        // et les callbacks onRecords, onRecord, etc.
        
        // Bouton créer
        const createButton = document.getElementById('create-button');
        if (createButton) {
            createButton.addEventListener('click', handleCreateButton);
        }
        
        // Toggle pour navigation vers autre page
        const toggle = document.getElementById('toggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    console.log('Toggle activé - navigation vers autre page');
                    // Ici vous devrez implémenter la navigation vers l'autre page
                    // Par exemple : window.location.href = '/path/to/other-page.html';
                }
            });
        }
    }, 100);
});