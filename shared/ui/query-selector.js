// ================================================================================
// SECTION: GESTION DE LA SÉLECTION DYNAMIQUE DES REQUÊTES
// ================================================================================

/**
 * Met à jour la liste déroulante des noms de requêtes
 */
function updateQuerySelector() {
    const querySelect = document.getElementById('querySelect');
    if (!querySelect) {
        console.warn("Élément querySelect non trouvé");
        return;
    }
    
    // Vider les options existantes
    querySelect.innerHTML = '<option value="">-- Sélectionner une requête --</option>';
    
    if (!allRecords.length || !requestNameField) {
        console.log("Aucun enregistrement ou champ nom de requête non défini");
        return;
    }

    // Créer un Set pour éviter les doublons et collecter les noms
    const uniqueQueryNames = new Set();
    
    allRecords.forEach(record => {
        const queryName = record[requestNameField];
        if (queryName && queryName.trim()) {
            uniqueQueryNames.add(queryName.trim());
        }
    });

    // Trier les noms et créer les options
    Array.from(uniqueQueryNames)
        .sort()
        .forEach(queryName => {
            const option = document.createElement('option');
            option.value = queryName;
            option.textContent = queryName;
            querySelect.appendChild(option);
        });

    console.log(`${uniqueQueryNames.size} requêtes uniques ajoutées au sélecteur`);
}

/**
 * Charge une requête sélectionnée dans l'éditeur
 */
function loadSelectedQuery(queryName) {
    if (!queryName || !allRecords.length || !sqlField || !pythonfield) {
        console.log("Paramètres manquants pour charger la requête");
        return;
    }

    // Trouver l'enregistrement correspondant au nom de la requête
    const matchingRecord = allRecords.find(record => {
        return record[requestNameField] === queryName;
    });

    if (!matchingRecord) {
        console.log("Aucun enregistrement trouvé pour:", queryName);
        updateStatus('error', 'Requête non trouvée');
        return;
    }

    console.log("Chargement de la requête:", queryName);
    
    // Charger cette requête comme si c'était un changement d'enregistrement
    loadQueryIntoEditor(matchingRecord);
}

/**
 * Charge une requête spécifique dans l'éditeur
 */
function loadQueryIntoEditor(record) {
    // Parser et traiter la colonne Python pour extraire les tables et colonnes
    if (pythonfield && record[pythonfield]) {
        console.log("Contenu Python trouvé pour la requête");
        tableColumnsData = parsePythonTableData(record[pythonfield]);
        updateTableSelector();
    } else {
        console.log("Aucun contenu Python trouvé pour cette requête");
        tableColumnsData = {};
        tableColumns = {};
        updateTableSelector();
    }
    
    // Charger la table de destination par défaut si définie
    if (destinationTableField && record[destinationTableField]) {
        const encodedDestinationTable = record[destinationTableField];
        // Décoder l'ID de table vers le nom actuel
        const defaultDestinationTable = decodeTableIdToName(encodedDestinationTable);
        console.log("Table de destination par défaut trouvée:", encodedDestinationTable, "→", defaultDestinationTable);
        setDefaultDestinationTable(defaultDestinationTable);
    }
    
    // Charger le contenu SQL
    if (editor) {
        editor.setReadOnly(false);
        
        let sqlContent = record[sqlField];
        if (typeof sqlContent !== 'string') {
            sqlContent = String(sqlContent || '');
        }
        
        // Convertir les IDs en labels pour l'affichage
        if (sqlContent && sqlContent.trim() !== '') {
            sqlContent = convertSqlIdsToLabels(sqlContent);
        } else {
            const tablesList = Object.keys(tableColumns).join(', ') || 'Aucune depuis Python';
            sqlContent = `-- Requête sélectionnée: ${record[requestNameField] || 'Sans nom'}
-- Tables Python disponibles : ${tablesList}
SELECT * FROM ma_table LIMIT 10;`;
        }
        
        try {
            editor.setValue(sqlContent, -1);
        } catch (aceError) {
            console.error("Erreur Ace Editor:", aceError);
            editor.setValue("-- Erreur de chargement du contenu SQL", -1);
        }
    }
    
    // Mettre à jour l'enregistrement actuel (pour la sauvegarde)
    oldRecord = record;
    
    // Activer les boutons
    document.getElementById('saveBtn').disabled = false;
    document.getElementById('executeBtn').disabled = false;
    
    // Configurer le gestionnaire de sauvegarde pour cet enregistrement
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.onclick = () => save(record);
    
    const tableCount = Object.keys(tableColumns).length;
    updateStatus('connected', `Requête chargée - ${tableCount} tables Python disponibles`);
}

/**
 * Définit la table de destination par défaut dans la liste déroulante
 */
function setDefaultDestinationTable(tableName) {
    const targetTableSelect = document.getElementById('targetTable');
    if (!targetTableSelect) {
        console.warn("Élément targetTable non trouvé pour définir la table par défaut");
        return;
    }
    
    // Chercher l'option correspondante dans la liste
    const options = targetTableSelect.options;
    for (let i = 0; i < options.length; i++) {
        if (options[i].value === tableName) {
            targetTableSelect.selectedIndex = i;
            console.log("Table de destination par défaut définie:", tableName);
            return;
        }
    }
    
    // Si la table n'est pas dans la liste, l'ajouter temporairement
    console.warn("Table de destination par défaut non trouvée dans la liste, ajout temporaire:", tableName);
    const tempOption = document.createElement('option');
    tempOption.value = tableName;
    tempOption.textContent = tableName + ' (par défaut)';
    targetTableSelect.appendChild(tempOption);
    targetTableSelect.value = tableName;
}