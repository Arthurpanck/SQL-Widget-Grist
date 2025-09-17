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
    
    // Initialiser la navigation compacte
    if (typeof addCompactNavigationToContainer === 'function') {
        addCompactNavigationToContainer('user-view-button', 'compact-navigation');
    }
    
    // Charger le bouton depuis localStorage
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
 * Charge le bouton sélectionné depuis localStorage
 */
function loadSelectedButton() {
    try {
        const buttonData = localStorage.getItem('selectedButton');
        
        if (!buttonData) {
            console.log('Aucun bouton sélectionné, affichage de l\'état par défaut');
            showNoButtonState();
            return;
        }
        
        selectedButton = JSON.parse(buttonData);
        console.log('Bouton sélectionné chargé:', selectedButton);
        
        if (!selectedButton || !selectedButton.name) {
            console.warn('Données du bouton invalides');
            showNoButtonState();
            return;
        }
        
        // Afficher le bouton
        displayButton();
        
    } catch (error) {
        console.error('Erreur lors du chargement du bouton sélectionné:', error);
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
    
    // Générer une description basée sur le nombre de requêtes
    const sequenceLength = selectedButton.sequence ? selectedButton.sequence.length : 0;
    let description = '';
    if (sequenceLength === 0) {
        description = 'Aucune requête configurée';
    } else if (sequenceLength === 1) {
        description = '1 requête à exécuter';
    } else {
        description = `${sequenceLength} requêtes à exécuter`;
    }
    document.getElementById('button-description').textContent = description;
    
    console.log(`Bouton "${selectedButton.name}" affiché avec ${sequenceLength} requêtes`);
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
    document.getElementById('execution-status').classList.remove('hidden');
    updateExecutionProgress(0, 'Initialisation...');
}

/**
 * Met à jour la progression de l'exécution
 */
function updateExecutionProgress(percentage, message) {
    document.getElementById('progress-bar').style.width = percentage + '%';
    document.getElementById('progress-text').textContent = Math.round(percentage) + '% terminé';
    document.getElementById('status-message').textContent = message;
}

/**
 * Exécute une séquence de requêtes
 */
async function executeSequence(sequence) {
    try {
        if (!allRecords) {
            throw new Error('Données non disponibles - veuillez actualiser la page');
        }
        
        const total = sequence.length;
        
        for (let i = 0; i < sequence.length; i++) {
            const recordId = sequence[i];
            const progress = ((i + 1) / total) * 100;
            
            // Trouver l'enregistrement correspondant
            const record = allRecords.find(r => r.id === recordId);
            if (!record) {
                console.warn(`Enregistrement ${recordId} non trouvé, passage au suivant`);
                updateExecutionProgress(progress, `Requête ${i + 1}/${total} - Enregistrement manquant`);
                continue;
            }
            
            updateExecutionProgress(progress, `Exécution requête ${i + 1}/${total}...`);
            
            // Simuler l'exécution (à remplacer par la vraie logique)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log(`Requête ${i + 1}/${total} exécutée (ID: ${recordId})`);
        }
        
        // Succès
        showExecutionSuccess();
        
    } catch (error) {
        console.error('Erreur lors de l\'exécution:', error);
        showExecutionError(error.message);
    } finally {
        isExecuting = false;
    }
}

/**
 * Affiche le succès de l'exécution
 */
function showExecutionSuccess() {
    document.getElementById('status-icon').textContent = '✅';
    document.getElementById('status-title').textContent = 'Exécution terminée avec succès';
    document.getElementById('status-message').textContent = 'Toutes les requêtes ont été exécutées correctement.';
    updateExecutionProgress(100, 'Terminé');
}

/**
 * Affiche une erreur d'exécution
 */
function showExecutionError(message) {
    document.getElementById('status-icon').textContent = '❌';
    document.getElementById('status-title').textContent = 'Erreur d\'exécution';
    document.getElementById('status-message').textContent = message;
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

// Export pour utilisation globale
window.initializeUserPage = initializeUserPage;
window.executeButton = executeButton;
window.changeButton = changeButton;