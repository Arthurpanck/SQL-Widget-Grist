// ================================================================================
// VIEW USER PAGE - Version simplifiée pour l'exécution de boutons
// ================================================================================

let selectedButton = null;
let isExecuting = false;

/**
 * Initialise la page utilisateur
 */
function initializeUserPage() {
    console.log('Initialisation de la page utilisateur');
    loadSelectedButton();
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
        
        // Afficher le bouton
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
    
    // Activer le bouton
    userButton.disabled = false;
    
    // Configurer l'event listener
    userButton.addEventListener('click', executeButton);
}

/**
 * Exécute le bouton sélectionné
 */
async function executeButton() {
    if (isExecuting) return;
    
    if (!selectedButton || !selectedButton.sequence || selectedButton.sequence.length === 0) {
        alert('Aucune requête à exécuter pour ce bouton');
        return;
    }
    
    console.log('Exécution du bouton:', selectedButton.name);
    
    isExecuting = true;
    const userButton = document.getElementById('user-button');
    const buttonText = document.getElementById('button-text');
    
    // Mise à jour de l'interface
    userButton.disabled = true;
    buttonText.textContent = 'Exécution en cours...';
    
    try {
        // Exécuter les requêtes SQL via Grist
        await executeSequentialQueries(selectedButton.sequence);
        
        // Succès
        buttonText.textContent = '✓ Terminé';
        setTimeout(() => {
            buttonText.textContent = selectedButton.name;
            userButton.disabled = false;
            isExecuting = false;
        }, 2000);
        
    } catch (error) {
        console.error('Erreur lors de l\'exécution:', error);
        buttonText.textContent = '✗ Erreur';
        setTimeout(() => {
            buttonText.textContent = selectedButton.name;
            userButton.disabled = false;
            isExecuting = false;
        }, 2000);
    }
}

/**
 * Exécute une séquence de requêtes
 */
async function executeSequentialQueries(queryIds) {
    console.log('Exécution des requêtes:', queryIds);
    
    // Simuler l'exécution pour l'instant
    // TODO: Intégrer avec le système d'exécution SQL réel
    for (let i = 0; i < queryIds.length; i++) {
        const queryId = queryIds[i];
        console.log(`Exécution requête ${i + 1}/${queryIds.length} (ID: ${queryId})`);
        
        // Simuler un délai d'exécution
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simuler une chance d'échec (10%)
        if (Math.random() < 0.1) {
            throw new Error(`Erreur lors de l'exécution de la requête ${queryId}`);
        }
    }
    
    console.log('Toutes les requêtes ont été exécutées avec succès');
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

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    initializeUserPage();
});