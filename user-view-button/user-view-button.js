// ================================================================================
// USER VIEW BUTTON - Interface utilisateur pour l'affichage et l'exécution de boutons
// ================================================================================

let selectedButton = null;
let isExecuting = false;

/**
 * Initialise la page utilisateur
 */
function initializeUserPage() {
    console.log('Initialisation de la page vue utilisateur bouton');
    
    // Charger le bouton exposé depuis Grist
    loadSelectedButton();
    
    // Configurer Grist pour récupérer les données
    if (typeof configureGristSettings === 'function') {
        configureGristSettings();
        console.log('Configuration Grist initialisée');
    } else {
        console.error('configureGristSettings non disponible - composants core non chargés?');
        showError('Erreur de configuration - composants manquants');
    }
}

/**
 * Charge le bouton exposé depuis Grist
 */
function loadSelectedButton() {
    // Ne rien faire ici, on attend les données de Grist
    console.log('Attente des données Grist pour charger le bouton exposé...');
}

/**
 * Fonction appelée quand les données Grist arrivent
 */
function onRecords(records, mappings) {
    allRecords = records || [];
    console.log(`${allRecords.length} enregistrements reçus pour la vue utilisateur`);
    
    // Charger le bouton exposé
    loadExposedButton();
}

/**
 * Normalise un bouton pour s'assurer qu'il a le champ exposed
 */
function normalizeButton(button) {
    return {
        ...button,
        exposed: button.exposed !== undefined ? button.exposed : false
    };
}

/**
 * Charge le bouton marqué comme exposé depuis les données Grist
 */
function loadExposedButton() {
    try {
        if (!allRecords || allRecords.length === 0) {
            console.log('Aucun enregistrement disponible');
            showNoButtonState();
            return;
        }
        
        let exposedButton = null;
        
        // Chercher le bouton exposé dans tous les enregistrements
        for (const record of allRecords) {
            if (!record[buttonConfigField]) continue;
            
            try {
                const buttons = ButtonManager.readButtonConfig(record);
                console.log('Boutons lus dans enregistrement', record.id, ':', buttons);
                
                // Normaliser tous les boutons et chercher celui qui est exposé
                const normalizedButtons = buttons.map(normalizeButton);
                const exposed = normalizedButtons.find(button => button.exposed === true);
                
                if (exposed) {
                    exposedButton = exposed;
                    console.log('Bouton exposé trouvé:', exposedButton);
                    break;
                }
            } catch (error) {
                console.warn('Erreur lecture boutons dans enregistrement', record.id, ':', error);
            }
        }
        
        if (exposedButton) {
            selectedButton = exposedButton;
            displayButton();
        } else {
            console.log('Aucun bouton exposé trouvé');
            showNoButtonState();
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement du bouton exposé:', error);
        showNoButtonState();
    }
}

/**
 * Affiche l'état "aucun bouton sélectionné"
 */
function showNoButtonState() {
    document.getElementById('no-button-state').classList.remove('hidden');
    document.getElementById('button-display').classList.add('hidden');
}

/**
 * Affiche le bouton sélectionné
 */
function displayButton() {
    if (!selectedButton) {
        showNoButtonState();
        return;
    }
    
    // Cacher l'état "aucun bouton" et afficher le bouton
    document.getElementById('no-button-state').classList.add('hidden');
    document.getElementById('button-display').classList.remove('hidden');
    
    // Mettre à jour le contenu du bouton
    document.getElementById('button-name').textContent = selectedButton.name;
    
    // Appliquer les couleurs du bouton si disponibles
    applyButtonColors();
    
    const sequenceLength = selectedButton.sequence ? selectedButton.sequence.length : 0;
    console.log(`Bouton "${selectedButton.name}" affiché avec ${sequenceLength} requêtes`);
}

/**
 * Applique les couleurs du bouton selon le format button-selection-page
 */
function applyButtonColors() {
    const userButton = document.getElementById('user-button');
    if (!userButton || !selectedButton) return;
    
    // Palette de couleurs avec classes Tailwind identique à button-selection-page
    const buttonColors = [
        { bg: 'bg-soft-green', text: 'text-soft-green-text', bgHex: '#a8e6cf', textHex: '#2e7d32' },
        { bg: 'bg-soft-orange', text: 'text-soft-orange-text', bgHex: '#ffb366', textHex: '#5d4037' },
        { bg: 'bg-soft-pink', text: 'text-soft-pink-text', bgHex: '#f8bbd9', textHex: '#6a1b9a' },
        { bg: 'bg-soft-blue', text: 'text-soft-blue-text', bgHex: '#a8d8ea', textHex: '#1565c0' },
        { bg: 'bg-soft-purple', text: 'text-soft-purple-text', bgHex: '#d1c4e9', textHex: '#4527a0' },
        { bg: 'bg-soft-yellow', text: 'text-soft-yellow-text', bgHex: '#fff3a0', textHex: '#f57f17' },
        { bg: 'bg-soft-teal', text: 'text-soft-teal-text', bgHex: '#b2dfdb', textHex: '#00695c' },
        { bg: 'bg-soft-coral', text: 'text-soft-coral-text', bgHex: '#ffcdd2', textHex: '#c62828' }
    ];
    
    // Calculer l'index de couleur basé sur le nom du bouton (même algorithme que button-selection-page)
    const colorIndex = Math.abs(selectedButton.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % buttonColors.length;
    const colorScheme = buttonColors[colorIndex];
    
    // Nettoyer les anciennes classes
    userButton.className = userButton.className.replace(/bg-soft-\w+|text-soft-\w+-text/g, '');
    
    // Ajouter les nouvelles classes de couleur
    userButton.classList.add(colorScheme.bg, colorScheme.text);
    
    console.log(`Couleurs appliquées: ${colorScheme.bg} ${colorScheme.text}`);
}

/**
 * Exécute le bouton sélectionné
 */
function executeButton() {
    if (!selectedButton || isExecuting) {
        return;
    }
    
    if (!selectedButton.sequence || selectedButton.sequence.length === 0) {
        showError('Ce bouton ne contient aucune requête à exécuter.');
        return;
    }
    
    isExecuting = true;
    showExecutionStatus();
    
    console.log(`Début d'exécution du bouton "${selectedButton.name}"`);
    
    // Simuler l'exécution des requêtes (à remplacer par la vraie logique d'exécution)
    executeSequence(selectedButton.sequence);
}

/**
 * Affiche le statut d'exécution
 */
function showExecutionStatus() {
    // Changer le texte du bouton pour indiquer l'exécution
    const buttonName = document.getElementById('button-name');
    if (buttonName) {
        buttonName.textContent = 'Exécution en cours...';
    }
    console.log('Début d\'exécution...');
}

/**
 * Met à jour la progression de l'exécution
 */
function updateExecutionProgress(percentage, message) {
    // Mettre à jour le texte du bouton avec la progression
    const buttonName = document.getElementById('button-name');
    if (buttonName) {
        buttonName.textContent = `${Math.round(percentage)}% - ${message}`;
    }
    console.log(`Progression: ${percentage}% - ${message}`);
}

/**
 * Exécute une séquence de requêtes avec la vraie logique SQL
 */
async function executeSequence(sequence) {
    try {
        if (!allRecords) {
            throw new Error('Données non disponibles - veuillez actualiser la page');
        }
        
        if (!sqlField) {
            throw new Error('Champ SQL non configuré');
        }
        
        const total = sequence.length;
        console.log('Début exécution séquentielle de', total, 'requêtes');
        
        for (let i = 0; i < sequence.length; i++) {
            const recordId = sequence[i];
            const progress = ((i + 1) / total) * 100;
            
            console.log(`Exécution requête ${i + 1}/${total} (ID: ${recordId})`);
            updateExecutionProgress(progress, `Exécution requête ${i + 1}/${total}...`);
            
            // Trouver l'enregistrement correspondant
            const record = allRecords.find(r => r.id === recordId);
            if (!record) {
                console.warn(`Enregistrement ${recordId} non trouvé, passage au suivant`);
                continue;
            }
            
            // Extraire le SQL de l'enregistrement
            const sqlQuery = record[sqlField];
            if (!sqlQuery || sqlQuery.trim() === '') {
                console.warn(`Requête vide pour l'ID ${recordId}, on continue...`);
                continue;
            }
            
            console.log(`SQL à exécuter pour ID ${recordId}:`, sqlQuery.substring(0, 100) + '...');
            
            // Exécuter la requête avec l'architecture existante
            await executeSingleQuery(record, sqlQuery);
        }
        
        // Succès
        showExecutionSuccess();
        console.log('Séquence terminée avec succès');
        
    } catch (error) {
        console.error('Erreur lors de l\'exécution:', error);
        showExecutionError(error.message);
    } finally {
        isExecuting = false;
    }
}

/**
 * Exécute une seule requête SQL en utilisant l'architecture de sql-executor
 */
async function executeSingleQuery(record, sqlQuery) {
    try {
        // Parser les métadonnées Python de cet enregistrement pour les conversions
        if (record[pythonfield]) {
            const tableData = parsePythonTableData(record[pythonfield]);
            console.log('Métadonnées chargées pour la requête:', Object.keys(tableData).length, 'tables');
        }
        
        // Vérifier si une table de destination est définie
        const destinationTableRaw = record[destinationTableField];
        if (!destinationTableRaw) {
            console.warn('Aucune table de destination définie pour cette requête, exécution sans application des résultats');
        }
        
        // Décoder la table de destination de [Table:15] vers le vrai nom
        let destinationTable = destinationTableRaw;
        if (destinationTableRaw && destinationTableRaw.startsWith('[Table:')) {
            // Extraire l'ID de la table
            const tableIdMatch = destinationTableRaw.match(/\[Table:(\d+)\]/);
            if (tableIdMatch && tableIdToName) {
                const tableId = tableIdMatch[1];
                const realTableName = tableIdToName[tableId];
                if (realTableName) {
                    destinationTable = realTableName;
                    console.log(`Table de destination décodée: ${destinationTableRaw} -> ${destinationTable}`);
                } else {
                    console.warn(`Impossible de décoder la table ${destinationTableRaw}, ID non trouvé dans les mappings`);
                }
            }
        }
        
        // Convertir les labels en IDs pour l'exécution (comme dans sql-executor)
        const sqlQueryWithIds = convertSqlLabelsToIds(sqlQuery);
        
        // Reconvertir les IDs en labels pour l'API SQL de Grist
        const sqlQueryForExecution = convertSqlIdsToLabels(sqlQueryWithIds);
        
        console.log('SQL final pour exécution:', sqlQueryForExecution.substring(0, 100) + '...');
        console.log('Table de destination:', destinationTable || 'Aucune');
        
        // Obtenir le token d'accès
        const tokenInfo = await grist.docApi.getAccessToken({ readOnly: false });
        const baseUrl = tokenInfo.baseUrl;
        const token = tokenInfo.token;
        
        // Construire l'URL et exécuter
        const sqlEndpoint = `${baseUrl}/sql?q=${encodeURIComponent(sqlQueryForExecution)}&auth=${token}`;
        
        const sqlResponse = await fetch(sqlEndpoint, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        const sqlResult = await sqlResponse.json();
        
        // Vérifier les erreurs
        if (sqlResult.error) {
            throw new Error(`Erreur SQL: ${sqlResult.error}`);
        }
        
        console.log(`Requête exécutée avec succès, ${sqlResult.records ? sqlResult.records.length : 0} résultats`);
        
        // Appliquer les résultats à la table de destination si définie et si il y a des données
        if (destinationTable && sqlResult.records && sqlResult.records.length > 0) {
            console.log('=== DÉBUT APPLICATION RÉSULTATS ===');
            console.log('destinationTable:', destinationTable);
            console.log('sqlResult.records:', sqlResult.records);
            console.log('Premier sqlResult.record:', sqlResult.records[0]);
            
            try {
                // Préparer les données exactement comme dans sql-executor.js
                console.log('Étape 1: Extraction des champs...');
                const records = sqlResult.records.map(record => record.fields);
                console.log('Records après extraction:', records);
                console.log('Premier record après extraction:', records[0]);
                
                console.log('Étape 2: Conversion BulkColValues...');
                const bulkData = convertToBulkColValues(records);
                console.log('BulkData créé:', bulkData);
                
                // Générer les IDs séquentiels
                console.log('Étape 3: Génération des IDs...');
                const IDs = Array.from({length: records.length}, (x, i) => i + 1);
                console.log('IDs générés:', IDs);
                
                // Appliquer les données à la table directement
                console.log('Étape 4: Application à la table...');
                console.log(`Insertion de ${records.length} enregistrements dans ${destinationTable}`);
                console.log('Appel applyUserActions avec:', ['ReplaceTableData', destinationTable, IDs, bulkData]);
                
                await grist.docApi.applyUserActions([
                    ['ReplaceTableData', destinationTable, IDs, bulkData]
                ]);
                console.log('✅ Résultats appliqués avec succès à la table', destinationTable);
                
            } catch (innerError) {
                console.error('❌ ERREUR dans l\'application des résultats:', innerError);
                console.error('Stack trace:', innerError.stack);
                throw innerError;
            }
        } else if (destinationTable && (!sqlResult.records || sqlResult.records.length === 0)) {
            console.log('Aucun résultat à appliquer à la table de destination');
        }
        
    } catch (error) {
        console.error('Erreur lors de l\'exécution de la requête:', error);
        throw error; // Remonter l'erreur pour arrêter la séquence
    }
}

/**
 * Convertit un tableau d'objets en format BulkColValues pour Grist
 */
function convertToBulkColValues(records) {
    if (records.length === 0) {
        throw new Error("Aucune donnée à insérer.");
    }

    console.log('convertToBulkColValues - Premier record:', records[0]);
    console.log('convertToBulkColValues - Type du premier record:', typeof records[0]);
    console.log('convertToBulkColValues - Array.isArray(records[0]):', Array.isArray(records[0]));

    // Vérifier si les records sont des objets ou des listes
    if (Array.isArray(records[0])) {
        throw new Error("Les records sont des listes, pas des objets. Structure inattendue.");
    }

    // Extraire les noms de colonnes
    const columns = Object.keys(records[0]);
    console.log('convertToBulkColValues - Colonnes détectées:', columns);

    // Construire l'objet BulkColValues
    let bulkColValues = {};
    columns.forEach(col => {
        bulkColValues[col] = records.map(row => row[col] ?? null);
    });

    console.log('convertToBulkColValues - Résultat:', bulkColValues);
    return bulkColValues;
}


/**
 * Affiche le succès de l'exécution
 */
function showExecutionSuccess() {
    const buttonName = document.getElementById('button-name');
    if (buttonName && selectedButton) {
        buttonName.textContent = '✅ Terminé';
        // Remettre le nom original après 2 secondes
        setTimeout(() => {
            if (buttonName && selectedButton) {
                buttonName.textContent = selectedButton.name;
            }
        }, 2000);
    }
    console.log('Exécution terminée avec succès');
}

/**
 * Affiche une erreur d'exécution
 */
function showExecutionError(message) {
    const buttonName = document.getElementById('button-name');
    if (buttonName && selectedButton) {
        buttonName.textContent = '❌ Erreur';
        // Remettre le nom original après 3 secondes
        setTimeout(() => {
            if (buttonName && selectedButton) {
                buttonName.textContent = selectedButton.name;
            }
        }, 3000);
    }
    console.error('Erreur d\'exécution:', message);
    // Aussi afficher l'erreur à l'utilisateur
    alert('Erreur lors de l\'exécution: ' + message);
}

/**
 * Affiche une erreur générale
 */
function showError(message) {
    // Pour l'instant, utiliser console.error, peut être amélioré avec une modal
    console.error(message);
    alert(message);
}

/**
 * Permet de changer de bouton
 */
function changeButton() {
    localStorage.removeItem('selectedButton');
    window.location.href = '../button-selection-page/index.html';
}

/**
 * Initialisation au chargement de la page
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation de la page utilisateur');
    initializeUserPage();
});

// Override de la fonction onRecords globale
window.onRecords = onRecords;

// Export pour utilisation globale
window.initializeUserPage = initializeUserPage;
window.executeButton = executeButton;
window.changeButton = changeButton;