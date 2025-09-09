// ================================================================================
// SECTION: SAUVEGARDE ET LOGIQUE PRINCIPALE SQL EDITOR
// ================================================================================

/**
 * Sauvegarde le contenu de l'éditeur dans la colonne Grist
 */
function save(record) {
    if (!editor || !sqlField) {
        console.warn("Éditeur ou champ SQL non initialisé");
        return;
    }
    
    try {
        const sqlWithLabels = editor.getValue();
        
        // Convertir les labels en IDs avant la sauvegarde
        const sqlWithIds = convertSqlLabelsToIds(sqlWithLabels);
        
        console.log("Sauvegarde du SQL (avec IDs):", sqlWithIds.substring(0, 100) + "...");
        
        // Préparer les champs à sauvegarder
        const fieldsToUpdate = {[sqlField]: sqlWithIds};
        
        // Ajouter la table de destination si elle est sélectionnée et si le champ existe
        const targetTableSelect = document.getElementById('targetTable');
        if (targetTableSelect && targetTableSelect.value && destinationTableField) {
            const selectedDestinationTable = targetTableSelect.value;
            // Encoder le nom de table avec son ID pour résister aux changements de noms
            const encodedDestinationTable = encodeTableNameToId(selectedDestinationTable);
            fieldsToUpdate[destinationTableField] = encodedDestinationTable;
            console.log("Sauvegarde de la table de destination:", selectedDestinationTable, "→", encodedDestinationTable);
        }
        
        grist.selectedTable.update({
            id: record.id, 
            fields: fieldsToUpdate
        });
        
        updateStatus('saved', 'Sauvegardé avec succès');
        
        // Désactiver temporairement le bouton de sauvegarde
        setTimeout(() => {
            if (oldRecord) {
                updateStatus('connected', 'Connecté - Prêt à éditer');
            }
        }, 2000);
        
    } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        updateStatus('error', 'Erreur de sauvegarde');
    }
}

/**
 * Initialisation principale du widget SQL Editor
 */
ready(() => {
    console.log("Initialisation du widget SQL Editor & Executor Enhanced avec sélection dynamique");
    
    // Initialiser la navigation compacte
    console.log('Initialisation navigation - fonction disponible:', typeof addCompactNavigationToContainer);
    
    if (typeof addCompactNavigationToContainer === 'function') {
        addCompactNavigationToContainer('sql-editor', 'compact-navigation');
    } else {
        console.error('addCompactNavigationToContainer non disponible');
        // Fallback temporaire pour debug
        setTimeout(() => {
            const container = document.getElementById('compact-navigation');
            if (container) {
                container.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <span class="text-sm font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded">Créateur de requête</span>
                        <div class="flex space-x-1">
                            <button onclick="window.location.href='../button-flow-editor/index.html'" class="px-2 py-1 text-xs bg-gray-100 hover:bg-teal-100 text-gray-600 hover:text-teal-700 rounded transition-colors">Créateur de bouton</button>
                            <button onclick="window.location.href='../button-selection-page/index.html'" class="px-2 py-1 text-xs bg-gray-100 hover:bg-teal-100 text-gray-600 hover:text-teal-700 rounded transition-colors">Bibliothèque</button>
                        </div>
                    </div>
                `;
                console.log('Navigation fallback injectée');
            }
        }, 100);
    }
    
    // Initialiser l'éditeur Ace
    loadAceEditor();
    
    // Configurer les paramètres Grist
    configureGristSettings();
    
    // Charger les tables disponibles
    loadAvailableTables();
    
    // Configurer le gestionnaire d'exécution SQL
    const executeBtn = document.getElementById('executeBtn');
    executeBtn.addEventListener('click', executeSQL);
    
    // Configurer le gestionnaire de sélection de requête
    const querySelect = document.getElementById('querySelect');
    if (querySelect) {
        querySelect.addEventListener('change', function() {
            const selectedQuery = this.value;
            if (selectedQuery) {
                console.log("Sélection de la requête:", selectedQuery);
                loadSelectedQuery(selectedQuery);
            }
        });
    } else {
        console.warn("Élément querySelect non trouvé dans le DOM");
    }
    
    // Initialiser la navigation avec toggle
    if (typeof PageNavigation !== 'undefined') {
        PageNavigation.init('toggle', 'toggle-label');
        console.log("Navigation initialisée avec toggle");
    } else {
        console.error('PageNavigation non disponible - page-navigation.js non chargé?');
    }
    
    console.log("Widget Enhanced avec sélection dynamique initialisé avec succès");
});

// ================================================================================
// SECTION: FONCTIONS DE DEBUG ET MAINTENANCE
// ================================================================================

/**
 * Fonction de debug pour afficher les mappings actuels
 */
function debugMappings() {
    console.log("DEBUG - Mappings actuels:");
    console.log("Tables ID → Nom:", tableIdToName);
    console.log("Tables Nom → ID:", tableNameToId);
    console.log("Colonnes ID → Label:", columnIdToLabel);
    console.log("Colonnes Qualifiées → ID:", columnLabelToId);
    console.log("Structure des tables:", tableColumns);
    console.log("Tous les enregistrements:", allRecords.length);
}

/**
 * Fonction de debug pour la sélection de requêtes
 */
function debugQuerySelection() {
    console.log("DEBUG - Sélection de requêtes:");
    console.log("Champ nom de requête:", requestNameField);
    console.log("Nombre d'enregistrements:", allRecords.length);
    
    if (allRecords.length > 0 && requestNameField) {
        const queryNames = allRecords.map(record => record[requestNameField]).filter(name => name);
        console.log("Noms de requêtes trouvés:", queryNames);
    }
}

// Exposer les fonctions de debug globalement pour les tests
window.debugMappings = debugMappings;
window.debugQuerySelection = debugQuerySelection;