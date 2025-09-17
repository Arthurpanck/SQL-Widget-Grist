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
    
    // Appliquer les couleurs du bouton si disponibles
    applyButtonColors();
    
    console.log(`Bouton "${selectedButton.name}" affiché avec ${sequenceLength} requêtes`);
}

/**
 * Applique les couleurs du bouton selon le format button-selection-page
 */
function applyButtonColors() {
    const userButton = document.getElementById('user-button');
    if (!userButton || !selectedButton) return;
    
    // Palette de couleurs identique à button-selection-page
    const buttonColors = [
        { bg: '#a8e6cf', text: '#2e7d32' }, // soft-green
        { bg: '#ffb366', text: '#5d4037' }, // soft-orange
        { bg: '#f8bbd9', text: '#6a1b9a' }, // soft-pink
        { bg: '#a8d8ea', text: '#1565c0' }, // soft-blue
        { bg: '#d1c4e9', text: '#4527a0' }, // soft-purple
        { bg: '#fff3a0', text: '#f57f17' }, // soft-yellow
        { bg: '#b2dfdb', text: '#00695c' }, // soft-teal
        { bg: '#ffcdd2', text: '#c62828' }  // soft-coral
    ];
    
    // Calculer l'index de couleur basé sur le nom du bouton (même algorithme que button-selection-page)
    const colorIndex = Math.abs(selectedButton.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % buttonColors.length;
    const colorScheme = buttonColors[colorIndex];
    
    // Appliquer les couleurs
    userButton.style.backgroundColor = colorScheme.bg;
    userButton.style.color = colorScheme.text;
    
    // Mettre à jour la couleur de l'icône aussi
    const icon = userButton.querySelector('.material-icons');
    if (icon) {
        icon.style.color = colorScheme.text;
    }
    
    console.log(`Couleurs appliquées: bg=${colorScheme.bg}, text=${colorScheme.text}`);
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

// Override de la fonction onRecords globale
window.onRecords = onRecords;

// Export pour utilisation globale
window.initializeUserPage = initializeUserPage;
window.executeButton = executeButton;
window.changeButton = changeButton;