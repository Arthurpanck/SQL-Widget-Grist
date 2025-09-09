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
async function handleCreateButton() {
    const buttonName = document.getElementById('button-name').value.trim();
    const dropzone = document.getElementById('dropzone');
    
    if (!dropzone) {
        console.error('Dropzone non trouvée');
        return;
    }
    
    // Récupérer les noms des requêtes sélectionnées
    const selectedQueryNames = Array.from(dropzone.querySelectorAll('.bg-white')).map(item => {
        return item.querySelector('p').textContent;
    });
    
    if (!buttonName) {
        alert('Veuillez saisir un nom pour le bouton');
        return;
    }
    
    if (selectedQueryNames.length === 0) {
        alert('Veuillez sélectionner au moins une requête');
        return;
    }
    
    // Vérifier qu'on a des enregistrements disponibles
    if (!allRecords || allRecords.length === 0) {
        alert('Aucun enregistrement disponible pour sauvegarder le bouton');
        return;
    }
    
    try {
        // Convertir les noms de requêtes en IDs de lignes
        const querySequence = convertQueryNamesToIds(selectedQueryNames);
        
        if (querySequence.length === 0) {
            alert('Erreur: Impossible de trouver les IDs des requêtes sélectionnées');
            return;
        }
        
        // Vérifier si des requêtes ont été perdues dans la conversion
        if (querySequence.length < selectedQueryNames.length) {
            const missingCount = selectedQueryNames.length - querySequence.length;
            const confirmMessage = `Attention: ${missingCount} requête(s) n'ont pas pu être trouvées.\nVoulez-vous continuer avec les ${querySequence.length} requêtes trouvées ?`;
            if (!confirm(confirmMessage)) {
                return;
            }
        }
        
        // Créer l'objet bouton avec format JSON requis
        const newButton = {
            name: buttonName,
            sequence: querySequence,
            rgba: generateButtonColorFromName(buttonName)
        };
        
        // Valider le bouton avant sauvegarde
        if (typeof ButtonManager !== 'undefined') {
            const validation = ButtonManager.validateButton(newButton, allRecords);
            if (!validation.isValid) {
                console.warn('Bouton avec IDs potentiellement invalides:', validation);
            }
        }
        
        console.log('Nouveau bouton à sauvegarder:', newButton);
        console.log(`Sauvegarde dans ${allRecords.length} enregistrements...`);
        
        // Sauvegarder dans TOUS les enregistrements
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (const record of allRecords) {
            try {
                const success = await ButtonManager.addButton(record, newButton);
                if (success) {
                    successCount++;
                    console.log(`✓ Bouton sauvegardé dans l'enregistrement ID ${record.id}`);
                } else {
                    errorCount++;
                    console.warn(`✗ Échec sauvegarde dans l'enregistrement ID ${record.id}`);
                }
            } catch (error) {
                errorCount++;
                const errorMsg = `Enregistrement ID ${record.id}: ${error.message}`;
                errors.push(errorMsg);
                console.error(`✗ Erreur sauvegarde dans l'enregistrement ID ${record.id}:`, error);
            }
        }
        
        // Affichage du résultat
        if (successCount > 0) {
            let message = `Bouton "${buttonName}" sauvegardé avec succès!\n\n`;
            message += `✓ Sauvegardé dans ${successCount} enregistrement(s)\n`;
            if (errorCount > 0) {
                message += `✗ Échecs: ${errorCount} enregistrement(s)\n`;
            }
            message += `\nRequêtes incluses (${selectedQueryNames.length}):\n${selectedQueryNames.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
            message += `\n\nIDs sauvegardés: [${querySequence.join(', ')}]`;
            
            alert(message);
            
            // Réinitialiser le formulaire
            document.getElementById('button-name').value = '';
            dropzone.innerHTML = initialPlaceholder;
            
            console.log(`Bouton sauvegardé avec succès dans ${successCount}/${allRecords.length} enregistrements`);
        } else {
            let message = `Erreur: Impossible de sauvegarder le bouton "${buttonName}"\n\n`;
            message += `Échecs dans tous les ${errorCount} enregistrements`;
            if (errors.length > 0) {
                message += `\n\nErreurs:\n${errors.slice(0, 3).join('\n')}`;
                if (errors.length > 3) {
                    message += `\n... et ${errors.length - 3} autres erreurs`;
                }
            }
            
            alert(message);
        }
        
    } catch (error) {
        console.error('Erreur lors de la création du bouton:', error);
        alert('Erreur lors de la création du bouton: ' + error.message);
    }
}

/**
 * Génère une couleur rgba basée sur le nom du bouton (même logique que button-selection-page)
 * @param {string} buttonName - Nom du bouton
 * @returns {string} - Couleur au format rgba(r, g, b, a)
 */
function generateButtonColorFromName(buttonName) {
    // Même palette que button-selection-page mais en format rgba
    const buttonColorsRgba = [
        'rgba(168, 230, 207, 1)', // soft-green
        'rgba(255, 179, 102, 1)', // soft-orange
        'rgba(248, 187, 217, 1)', // soft-pink
        'rgba(168, 216, 234, 1)', // soft-blue
        'rgba(209, 196, 233, 1)', // soft-purple
        'rgba(255, 243, 160, 1)', // soft-yellow
        'rgba(178, 223, 219, 1)', // soft-teal
        'rgba(255, 205, 210, 1)'  // soft-coral
    ];
    
    // Même algorithme de sélection que dans button-selection-page
    const colorIndex = Math.abs(buttonName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % buttonColorsRgba.length;
    return buttonColorsRgba[colorIndex];
}

/**
 * Convertit les noms de requêtes en IDs de lignes
 * @param {Array} queryNames - Noms des requêtes sélectionnées
 * @returns {Array} - IDs des lignes correspondantes
 */
function convertQueryNamesToIds(queryNames) {
    const queryIds = [];
    
    queryNames.forEach(queryName => {
        // Trouver l'enregistrement avec ce nom de requête
        const matchingRecord = allRecords.find(record => {
            return record[requestNameField] === queryName;
        });
        
        if (matchingRecord) {
            queryIds.push(matchingRecord.id);
            console.log(`Requête "${queryName}" → ID ${matchingRecord.id}`);
        } else {
            console.warn(`Requête "${queryName}" non trouvée dans les enregistrements`);
        }
    });
    
    return queryIds;
}

// ================================================================================
// SECTION: GESTION DU TOGGLE DE NAVIGATION
// ================================================================================

/**
 * Instance de navigation pour ce composant
 */
let pageNavigation = null;

// ================================================================================
// SECTION: INITIALISATION
// ================================================================================

/**
 * Fonction d'initialisation principale
 */
function initializeButtonFlowEditor() {
    console.log('Initialisation du Button Flow Editor');
    
    // Initialiser la navigation
    if (typeof addNavigationToContainer === 'function') {
        addNavigationToContainer('button-flow-editor', 'navigation-container');
    }
    
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
    
    // Initialiser la navigation avec toggle
    if (typeof PageNavigation !== 'undefined') {
        pageNavigation = PageNavigation.init('toggle', 'toggle-label');
    } else {
        console.error('PageNavigation non disponible - page-navigation.js non chargé?');
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