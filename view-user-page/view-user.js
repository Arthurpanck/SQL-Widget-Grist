// ================================================================================
// VIEW USER PAGE - Exécution de boutons avec architecture SQL complète
// ================================================================================

let selectedButton = null;
let isExecuting = false;

/**
 * Initialise la page utilisateur
 */
function initializeUserPage() {
    console.log('Initialisation de la page utilisateur');
    
    // Charger le bouton depuis localStorage
    loadSelectedButton();
    
    // Configurer Grist pour récupérer les données (comme dans sql-editor)
    if (typeof configureGristSettings === 'function') {
        configureGristSettings();
        console.log('Configuration Grist initialisée');
    } else {
        console.error('configureGristSettings non disponible - composants core non chargés?');
        showError('Erreur de configuration - composants manquants');
    }
}

/**
 * Charge le bouton sélectionné depuis localStorage
 */
function loadSelectedButton() {
    try {
        const buttonData = localStorage.getItem('selectedButton');
        if (!buttonData) {
            showError('Aucun bouton sélectionné. Veuillez retourner à la page de sélection.');
            return;
        }
        
        selectedButton = JSON.parse(buttonData);
        console.log('Bouton sélectionné chargé:', selectedButton);
        
        if (!selectedButton || !selectedButton.name) {
            showError('Données du bouton invalides.');
            return;
        }
        
        // Afficher le bouton (sera activé quand les données Grist arrivent)
        displayButton();
        
    } catch (error) {
        console.error('Erreur lors du chargement du bouton sélectionné:', error);
        showError('Erreur lors du chargement du bouton sélectionné.');
    }
}

/**
 * Affiche le bouton dans l'interface
 */
function displayButton() {
    const loadingSection = document.getElementById('loading-section');
    const buttonSection = document.getElementById('button-section');
    
    // Masquer le loading, afficher le bouton
    loadingSection.classList.add('hidden');
    buttonSection.classList.remove('hidden');
    
    // Configurer le bouton
    const userButton = document.getElementById('user-button');
    const buttonText = document.getElementById('button-text');
    
    // Définir le texte
    buttonText.textContent = selectedButton.name;
    
    // Utiliser la couleur rgba sauvegardée ou couleur par défaut
    const backgroundColor = selectedButton.rgba || '#16b378';
    userButton.style.backgroundColor = backgroundColor;
    
    // Le bouton restera désactivé jusqu'à ce que les données Grist arrivent
    userButton.disabled = true;
    
    // Configurer l'event listener
    userButton.addEventListener('click', executeButton);
}

/**
 * Exécute le bouton sélectionné avec l'architecture SQL réelle
 */
async function executeButton() {
    if (isExecuting) return;
    
    if (!selectedButton || !selectedButton.sequence || selectedButton.sequence.length === 0) {
        alert('Aucune requête à exécuter pour ce bouton');
        return;
    }
    
    console.log('Exécution du bouton:', selectedButton.name);
    console.log('Séquence de requêtes:', selectedButton.sequence);
    
    isExecuting = true;
    const userButton = document.getElementById('user-button');
    const buttonText = document.getElementById('button-text');
    
    // Mise à jour de l'interface
    userButton.disabled = true;
    buttonText.textContent = 'Exécution en cours...';
    
    try {
        // Exécuter les requêtes dans l'ordre avec l'architecture existante
        await executeSequentialQueries(selectedButton.sequence);
        
        // Succès
        buttonText.textContent = '✓ Terminé';
        console.log('Toutes les requêtes ont été exécutées avec succès');
        
        setTimeout(() => {
            buttonText.textContent = selectedButton.name;
            userButton.disabled = false;
            isExecuting = false;
        }, 2000);
        
    } catch (error) {
        console.error('Erreur lors de l\'exécution:', error);
        buttonText.textContent = '✗ Erreur';
        
        // Afficher l'erreur à l'utilisateur
        alert('Erreur lors de l\'exécution: ' + error.message);
        
        setTimeout(() => {
            buttonText.textContent = selectedButton.name;
            userButton.disabled = false;
            isExecuting = false;
        }, 2000);
    }
}

/**
 * Exécute une séquence de requêtes en utilisant l'architecture existante
 */
async function executeSequentialQueries(queryIds) {
    console.log('Début exécution séquentielle de', queryIds.length, 'requêtes');
    
    // Vérifier qu'on a les données nécessaires
    if (!allRecords || allRecords.length === 0) {
        throw new Error('Aucune donnée disponible pour l\'exécution');
    }
    
    if (!sqlField) {
        throw new Error('Champ SQL non configuré');
    }
    
    for (let i = 0; i < queryIds.length; i++) {
        const queryId = queryIds[i];
        console.log(`Exécution requête ${i + 1}/${queryIds.length} (ID: ${queryId})`);
        
        // Trouver l'enregistrement correspondant
        const record = allRecords.find(r => r.id === queryId);
        if (!record) {
            throw new Error(`Enregistrement non trouvé pour l'ID ${queryId}`);
        }
        
        // Extraire le SQL de l'enregistrement
        const sqlQuery = record[sqlField];
        if (!sqlQuery || sqlQuery.trim() === '') {
            console.warn(`Requête vide pour l'ID ${queryId}, on continue...`);
            continue;
        }
        
        console.log(`SQL à exécuter pour ID ${queryId}:`, sqlQuery.substring(0, 100) + '...');
        
        // Exécuter la requête avec l'architecture existante
        await executeSingleQuery(record, sqlQuery);
    }
    
    console.log('Séquence terminée avec succès');
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
        
        // Convertir les labels en IDs pour l'exécution (comme dans sql-executor)
        const sqlQueryWithIds = convertSqlLabelsToIds(sqlQuery);
        
        // Reconvertir les IDs en labels pour l'API SQL de Grist
        const sqlQueryForExecution = convertSqlIdsToLabels(sqlQueryWithIds);
        
        console.log('SQL final pour exécution:', sqlQueryForExecution.substring(0, 100) + '...');
        
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
        
        // Note: On n'applique pas les résultats à une table car c'est juste de l'exécution
        // Si besoin d'appliquer les résultats, il faudrait ajouter une logique de destination
        
    } catch (error) {
        console.error('Erreur lors de l\'exécution de la requête:', error);
        throw error; // Remonter l'erreur pour arrêter la séquence
    }
}

/**
 * Affiche une erreur
 */
function showError(message) {
    const loadingSection = document.getElementById('loading-section');
    const errorSection = document.getElementById('error-section');
    const errorMessage = document.getElementById('error-message');
    
    loadingSection.classList.add('hidden');
    errorSection.classList.remove('hidden');
    errorMessage.textContent = message;
}

/**
 * Override de onRecords pour recevoir tous les enregistrements (comme dans button-selection-page)
 */
function onRecords(records, mappings) {
    console.log('🔄 === onRecords appelé dans view-user-page ===');
    console.log('Records reçus:', records ? records.length : 0);
    console.log('Mappings reçus:', mappings);
    
    allRecords = records || [];
    
    // Les mappings sont définis par grist-connector, on vérifie qu'ils sont là
    console.log('Champs mappés - SQL:', sqlField, 'Python:', pythonfield, 'RequestName:', requestNameField);
    
    // Activer le bouton si on a les données et qu'un bouton est sélectionné
    const userButton = document.getElementById('user-button');
    if (userButton && selectedButton && allRecords.length > 0) {
        userButton.disabled = false;
        console.log('Bouton activé - données disponibles');
    }
    
    console.log(`${allRecords.length} enregistrements disponibles pour l'exécution`);
}

// Remplacer la fonction onRecords globale (comme dans les autres pages)
window.onRecords = onRecords;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    initializeUserPage();
});