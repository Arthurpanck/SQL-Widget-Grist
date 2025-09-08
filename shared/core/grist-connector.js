// ================================================================================
// SECTION: GESTION DES ENREGISTREMENTS GRIST
// ================================================================================

/**
 * Gestionnaire lors du changement d'enregistrement
 */
function onRecord(record, mappings) {
    console.log("Changement d'enregistrement:", record);
    console.log("Mappings reçus:", mappings);
    
    // Définir les mappings
    sqlField = mappings["sqlField"];
    pythonfield = mappings["pythonfield"];
    requestNameField = mappings["RequestName"];
    
    console.log("Champs mappés - SQL:", sqlField, "Python:", pythonfield, "Nom requête:", requestNameField);
    
    // VÉRIFICATION CRITIQUE: Les deux colonnes doivent être différentes
    if (sqlField === pythonfield) {
        console.error("ERREUR: Les deux colonnes sont mappées sur le même champ:", sqlField);
        console.error("Vous devez mapper 'Code SQL' et 'Code Python' sur deux colonnes DIFFÉRENTES !");
        updateStatus('error', 'Erreur: colonnes identiques mappées');
        return;
    }
    
    // Sauvegarder l'ancien enregistrement si nécessaire
    if (oldRecord && editor && editor.getValue() !== oldRecord[sqlField]) {
        save(oldRecord);
    }
    
    // Charger ce nouvel enregistrement
    loadQueryIntoEditor(record);
}

/**
 * Gestionnaire lors de la création d'un nouvel enregistrement
 */
function onNewRecord(record) {
    console.log("Nouvel enregistrement:", record);
    
    // Sauvegarder l'ancien enregistrement
    if (oldRecord && editor) {
        save(oldRecord);
    }
    
    // Éditeur en lecture seule pour nouveau record
    if (editor) {
        editor.setReadOnly(true);
        editor.setValue("-- Sélectionnez un enregistrement pour éditer du SQL", -1);
    }
    
    // Réinitialiser l'ancien record
    oldRecord = null;
    tableColumnsData = {};
    tableColumns = {};
    
    // Désactiver les boutons
    document.getElementById('saveBtn').disabled = true;
    document.getElementById('executeBtn').disabled = true;
    
    updateStatus('waiting', 'En attente d\'un enregistrement');
}

/**
 * Gestionnaire pour récupérer tous les enregistrements
 */
function onRecords(records, mappings) {
    allRecords = records || [];
    console.log(`${allRecords.length} enregistrements reçus pour la sélection dynamique`);
    
    // Mettre à jour l'affichage des requêtes selon le contexte
    if (typeof updateQuerySelector === 'function') {
        // Contexte sql-editor
        updateQuerySelector();
    } else if (typeof updateQueriesDisplay === 'function') {
        // Contexte button-flow-editor
        updateQueriesDisplay();
    } else {
        console.warn('Aucune fonction de mise à jour des requêtes disponible');
    }
}

/**
 * Configure les paramètres Grist du widget
 */
function configureGristSettings() {
    grist.onRecord(onRecord);
    grist.onNewRecord(onNewRecord);
    grist.onRecords(onRecords); // Nouveau: pour récupérer tous les enregistrements
    
    grist.ready({
        requiredAccess: 'full',
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
}