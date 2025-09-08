// ================================================================================
// BUTTON FLOW EDITOR - Réutilise les fonctions du grist-connector.js
// ================================================================================

// Les variables globales (allRecords, requestNameField, etc.) sont déjà définies 
// dans /shared/grist-connector.js - on les réutilise directement

// ================================================================================
// SECTION: ADAPTATION DE updateQuerySelector POUR LE DRAG & DROP
// ================================================================================

/**
 * Met à jour l'affichage des requêtes disponibles pour le drag & drop
 * Adaptation de updateQuerySelector du grist-connector pour créer des éléments draggables
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
    
    if (!allRecords.length || !requestNameField) {
        console.log("Aucun enregistrement ou champ nom de requête non défini");
        noQueriesMessage.classList.remove('hidden');
        queriesContainer.classList.add('hidden');
        return;
    }

    // Réutiliser la même logique que updateQuerySelector du grist-connector
    const uniqueQueryNames = new Set();
    
    allRecords.forEach(record => {
        const queryName = record[requestNameField];
        if (queryName && queryName.trim()) {
            uniqueQueryNames.add(queryName.trim());
        }
    });

    if (uniqueQueryNames.size === 0) {
        noQueriesMessage.classList.remove('hidden');
        queriesContainer.classList.add('hidden');
        return;
    }

    noQueriesMessage.classList.add('hidden');
    queriesContainer.classList.remove('hidden');
    queriesContainer.innerHTML = '';
    
    // Créer les éléments draggables au lieu d'options select
    Array.from(uniqueQueryNames)
        .sort()
        .forEach((queryName, index) => {
            const queryElement = document.createElement('div');
            queryElement.className = 'draggable-item bg-gray-100 p-4 rounded-lg flex items-center justify-between hover:bg-gray-200 transition-colors';
            queryElement.draggable = true;
            queryElement.id = `query-${index}`;
            queryElement.dataset.queryName = queryName; // Stocker le nom pour usage ultérieur
            
            queryElement.innerHTML = `
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-800 truncate">${queryName}</p>
                </div>
                <span class="material-icons text-gray-400 ml-2 flex-shrink-0">drag_indicator</span>
            `;
            
            queriesContainer.appendChild(queryElement);
        });
    
    console.log(`${uniqueQueryNames.size} requêtes uniques ajoutées au drag & drop`);
    
    // Réinitialiser les event listeners du drag & drop
    initializeDragAndDrop();
}

// ================================================================================  
// SECTION: INTEGRATION AVEC LE GRIST-CONNECTOR
// ================================================================================

/**
 * Cette fonction sera appelée automatiquement par le grist-connector.js
 * quand il détecte que updateQueriesDisplay existe (voir modification du grist-connector)
 * Plus besoin d'override - utilisation du système de détection automatique
 */

// ================================================================================
// SECTION: DRAG & DROP FUNCTIONALITY
// ================================================================================

let initialPlaceholder;

/**
 * Initialise les fonctionnalités de drag & drop
 */
function initializeDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable-item');
    const dropzone = document.getElementById('dropzone');
    
    if (!dropzone) {
        console.error('Dropzone non trouvée');
        return;
    }
    
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
    
    // Event listeners pour la dropzone
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
        
        // Supprimer le placeholder si c'est le premier élément
        if (dropzone.querySelector('p.text-center')) {
            dropzone.innerHTML = '';
        }
        
        const id = e.dataTransfer.getData('text/plain');
        const draggableElement = document.getElementById(id);
        
        if (!draggableElement) return;
        
        // Vérifier si cette requête n'est pas déjà dans la dropzone
        const queryName = draggableElement.dataset.queryName;
        const existingQueries = Array.from(dropzone.querySelectorAll('.bg-white')).map(item => 
            item.querySelector('p').textContent
        );
        
        if (existingQueries.includes(queryName)) {
            console.log('Cette requête est déjà dans le workflow');
            return;
        }
        
        // Créer un clone pour la dropzone
        const clone = draggableElement.cloneNode(true);
        clone.classList.remove('draggable-item', 'bg-gray-100', 'hover:bg-gray-200');
        clone.classList.add('bg-white', 'shadow-sm', 'mb-3', 'border');
        clone.removeAttribute('draggable');
        clone.id = `dropped-${Date.now()}`; // ID unique pour les éléments droppés
        
        // Remplacer l'icône drag par un bouton delete
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

/**
 * Met à jour les connecteurs visuels entre les requêtes
 */
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

/**
 * Gère la création du bouton avec les requêtes sélectionnées
 */
function handleCreateButton() {
    const buttonName = document.getElementById('button-name').value.trim();
    const dropzone = document.getElementById('dropzone');
    
    if (!dropzone) {
        console.error('Dropzone non trouvée');
        return;
    }
    
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
    
    // Créer l'objet représentant le bouton
    const buttonConfig = {
        name: buttonName,
        queries: selectedQueries,
        createdAt: new Date().toISOString(),
        queryCount: selectedQueries.length
    };
    
    console.log('Configuration du bouton créé:', buttonConfig);
    
    // Ici vous pourrez ajouter la logique pour sauvegarder le bouton
    // Par exemple dans une table Grist ou dans localStorage
    
    // Affichage de confirmation
    const message = `Bouton "${buttonName}" créé avec succès!\n\nRequêtes incluses (${selectedQueries.length}):\n${selectedQueries.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    alert(message);
    
    // Optionnel: réinitialiser le formulaire
    document.getElementById('button-name').value = '';
    dropzone.innerHTML = initialPlaceholder;
}

// ================================================================================
// SECTION: GESTION DU TOGGLE
// ================================================================================

/**
 * Gère le basculement vers l'autre page via le toggle
 */
function handleToggleChange(e) {
    if (e.target.checked) {
        console.log('Toggle activé - basculement vers l\'éditeur de requêtes');
        
        // Vous pouvez implémenter différentes stratégies :
        
        // Option 1: Navigation simple
        // window.location.href = '/path/to/query-editor.html';
        
        // Option 2: Si vous utilisez un système de hash routing
        // window.location.hash = '#query-editor';
        
        // Option 3: Event custom pour un système de routing plus complexe
        window.dispatchEvent(new CustomEvent('navigate', { 
            detail: { page: 'query-editor' } 
        }));
        
        // Option 4: Affichage/masquage de sections si tout est dans la même page
        // document.getElementById('button-creator').classList.add('hidden');
        // document.getElementById('query-editor').classList.remove('hidden');
        
    }
}

// ================================================================================
// SECTION: INITIALISATION
// ================================================================================

/**
 * Fonction d'initialisation principale
 */
function initializeButtonFlowEditor() {
    console.log('Initialisation du Button Flow Editor');
    
    // Initialiser la connection Grist
    if (typeof configureGristSettings === 'function') {
        configureGristSettings();
        console.log('Configuration Grist initialisée');
    } else {
        console.error('configureGristSettings non disponible - grist-connector.js non chargé?');
    }
    
    // Configuration des event listeners
    const createButton = document.getElementById('create-button');
    if (createButton) {
        createButton.addEventListener('click', handleCreateButton);
    } else {
        console.error('Bouton create-button non trouvé');
    }
    
    const toggle = document.getElementById('toggle');
    if (toggle) {
        toggle.addEventListener('change', handleToggleChange);
    } else {
        console.error('Toggle non trouvé');
    }
    
    // Initialiser le drag & drop (sera réinitialisé quand les données arrivent)
    initializeDragAndDrop();
    
    console.log('Button Flow Editor initialisé avec succès');
}

// ================================================================================
// SECTION: LANCEMENT
// ================================================================================

// Attendre que le DOM soit chargé et que le grist-connector soit initialisé
document.addEventListener('DOMContentLoaded', () => {
    // Petit délai pour s'assurer que le grist-connector est chargé
    setTimeout(() => {
        initializeButtonFlowEditor();
    }, 100);
});