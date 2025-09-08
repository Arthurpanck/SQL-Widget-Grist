// Variables globales pour l'intégration Grist
let allRecords = [];
let sqlField, pythonfield, requestNameField;

// ================================================================================
// SECTION: INTÉGRATION GRIST
// ================================================================================

/**
 * Gestionnaire pour récupérer tous les enregistrements
 */
function onRecords(records, mappings) {
    allRecords = records || [];
    console.log(`${allRecords.length} enregistrements reçus pour la sélection dynamique`);
    
    // Définir les mappings
    sqlField = mappings["sqlField"];
    pythonfield = mappings["pythonfield"];
    requestNameField = mappings["RequestName"];
    
    // Mettre à jour l'affichage des requêtes
    updateQueriesDisplay();
}

/**
 * Gestionnaire lors du changement d'enregistrement (pas utilisé ici mais requis)
 */
function onRecord(record, mappings) {
    // Ne rien faire - on utilise seulement onRecords
}

/**
 * Gestionnaire lors de la création d'un nouvel enregistrement (pas utilisé ici mais requis)
 */
function onNewRecord(record) {
    // Ne rien faire - on utilise seulement onRecords
}

/**
 * Configure les paramètres Grist du widget
 */
function configureGristSettings() {
    if (typeof grist !== 'undefined') {
        grist.onRecord(onRecord);
        grist.onNewRecord(onNewRecord);
        grist.onRecords(onRecords);
        
        grist.ready({
            requiredAccess: 'read',
            columns: [
                {
                    name: "sqlField",
                    title: "Code SQL",
                    optional: false,
                    type: "Text",
                    description: "Code SQL à exécuter (avec conversion automatique ID/Label)",
                    allowMultiple: false,
                },
                {
                    name: "pythonfield",
                    title: "Code Python",
                    optional: false,
                    type: "Text",
                    description: "Métadonnées des tables (ancien ou nouveau format)",
                    allowMultiple: false,
                },
                {
                    name: "RequestName",
                    title: "Nom de la requête",
                    optional: false,
                    type: "Text",
                    description: "Nom de la requête sélectionnée",
                    allowMultiple: false,
                }
            ],
        });
    } else {
        // Mode développement - données factices
        setTimeout(() => {
            allRecords = [
                { id: 1, [requestNameField || 'RequestName']: 'Récupérer les utilisateurs' },
                { id: 2, [requestNameField || 'RequestName']: 'Mettre à jour le statut' },
                { id: 3, [requestNameField || 'RequestName']: 'Envoyer une notification' },
                { id: 4, [requestNameField || 'RequestName']: 'Archiver les données' },
                { id: 5, [requestNameField || 'RequestName']: 'Valider les formulaires' },
                { id: 6, [requestNameField || 'RequestName']: 'Générer un rapport' },
            ];
            requestNameField = 'RequestName';
            updateQueriesDisplay();
        }, 1000);
    }
}

/**
 * Met à jour l'affichage des requêtes disponibles
 */
function updateQueriesDisplay() {
    const loadingMessage = document.getElementById('loading-message');
    const queriesContainer = document.getElementById('queries-container');
    const noQueriesMessage = document.getElementById('no-queries-message');
    
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
    // Configuration Grist
    configureGristSettings();
    
    // Bouton créer
    document.getElementById('create-button').addEventListener('click', handleCreateButton);
    
    // Toggle (vous devrez implémenter la navigation vers l'autre page)
    document.getElementById('toggle').addEventListener('change', (e) => {
        if (e.target.checked) {
            console.log('Toggle activé - navigation vers autre page');
            // Ici vous devrez implémenter la navigation vers l'autre page
        }
    });
});