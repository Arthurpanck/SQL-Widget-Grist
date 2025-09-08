// ================================================================================
// SECTION: EXÉCUTION DES REQUÊTES SQL
// ================================================================================

/**
 * Convertit un tableau d'objets en format BulkColValues pour Grist
 */
function convertToBulkColValues(records) {
    if (records.length === 0) {
        throw new Error("Aucune donnée à insérer.");
    }

    // Extraire les noms de colonnes
    const columns = Object.keys(records[0]);

    // Construire l'objet BulkColValues
    let bulkColValues = {};
    columns.forEach(col => {
        bulkColValues[col] = records.map(row => row[col] ?? null);
    });

    return bulkColValues;
}

/**
 * Exécute la requête SQL et l'applique à la table de destination
 */
async function executeSQL() {
    const sqlQueryWithLabels = editor.getValue().trim();
    const targetTable = document.getElementById('targetTable').value;
    
    if (!sqlQueryWithLabels) {
        showResults('<div class="error">Veuillez entrer une requête SQL</div>');
        return;
    }
    
    if (!targetTable) {
        showResults('<div class="error">Veuillez sélectionner une table de destination</div>');
        return;
    }
    
    // Convertir les labels en IDs pour l'exécution
    const sqlQueryWithIds = convertSqlLabelsToIds(sqlQueryWithLabels);
    
    // Pour l'exécution, on reconvertit les IDs en labels (car l'API SQL de Grist utilise les noms)
    const sqlQueryForExecution = convertSqlIdsToLabels(sqlQueryWithIds);
    
    // Afficher le spinner
    const spinner = document.getElementById('spinner');
    const executeBtn = document.getElementById('executeBtn');
    
    spinner.style.display = 'block';
    executeBtn.disabled = true;
    updateStatus('executing', 'Exécution en cours...');
    
    try {
        // Obtenir le token d'accès
        const tokenInfo = await grist.docApi.getAccessToken({ readOnly: false });
        console.log("Token obtenu pour l'exécution SQL");
        
        const baseUrl = tokenInfo.baseUrl;
        const token = tokenInfo.token;
        
        // Construire l'URL de la requête SQL
        const sqlEndpoint = `${baseUrl}/sql?q=${encodeURIComponent(sqlQueryForExecution)}&auth=${token}`;
        console.log("Exécution de la requête:", sqlQueryForExecution);
        
        // Exécuter la requête
        const sqlResponse = await fetch(sqlEndpoint, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        const sqlResult = await sqlResponse.json();
        console.log("Résultat SQL:", sqlResult);
        
        // Vérifier les erreurs
        if (sqlResult.error) {
            throw new Error(`Erreur SQL: ${sqlResult.error}`);
        }
        
        // Vérifier les résultats
        if (!sqlResult.records || sqlResult.records.length === 0) {
            showResults('<div class="error">La requête n\'a retourné aucun résultat</div>');
            return;
        }
        
        // Préparer les données
        const records = sqlResult.records.map(record => record.fields);
        const bulkData = convertToBulkColValues(records);
        
        // Générer les IDs séquentiels
        const IDs = Array.from({length: records.length}, (x, i) => i + 1);
        
        // Appliquer les données à la table
        console.log(`Insertion de ${records.length} enregistrements dans ${targetTable}`);
        await grist.docApi.applyUserActions([
            ['ReplaceTableData', targetTable, IDs, bulkData]
        ]);
        
        // Afficher le succès avec information sur les mappings
        const mappingInfo = Object.keys(tableColumns).length > 0 ? 
            `<br>Mappings utilisés: ${Object.keys(tableNameToId).length} tables, ${Object.keys(columnIdToLabel).length} colonnes` : '';
        
        const successMessage = `
            <div class="success">
                ✅ Requête exécutée avec succès !<br>
                ${records.length} enregistrement(s) ajouté(s) à la table "${targetTable}"
                ${mappingInfo}
            </div>
            <div style="margin-top: 15px;">
                <h4>Aperçu des données :</h4>
                <pre style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; overflow: auto; max-height: 200px; font-size: 12px;">${JSON.stringify(records.slice(0, 5), null, 2)}${records.length > 5 ? '\n... et ' + (records.length - 5) + ' autres' : ''}</pre>
            </div>
        `;
        
        showResults(successMessage);
        updateStatus('success', 'Exécution réussie');
        
    } catch (error) {
        console.error('Erreur détaillée:', error);
        showResults(`<div class="error">❌ Erreur: ${error.message}</div>`);
        updateStatus('error', 'Erreur d\'exécution');
        
    } finally {
        // Masquer le spinner et réactiver le bouton
        spinner.style.display = 'none';
        executeBtn.disabled = false;
        
        // Retour au statut normal après quelques secondes
        setTimeout(() => {
            if (oldRecord) {
                updateStatus('connected', 'Connecté - Prêt à éditer');
            }
        }, 3000);
    }
}