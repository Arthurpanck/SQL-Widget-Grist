// ================================================================================
// SECTION: GESTION DE L'INTERFACE UTILISATEUR
// ================================================================================

/**
 * Met à jour l'indicateur de statut
 */
function updateStatus(status, message) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    // Réinitialiser les classes
    statusDot.className = 'status-dot';
    
    switch (status) {
        case 'connected':
            statusDot.classList.add('connected');
            break;
        case 'error':
        case 'executing':
            statusDot.classList.add('error');
            break;
        case 'success':
        case 'saved':
            statusDot.classList.add('connected');
            break;
        default:
            // Status par défaut (gris)
            break;
    }
    
    statusText.textContent = message;
}

/**
 * Affiche les résultats dans la section dédiée
 */
function showResults(htmlContent) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContent = document.getElementById('resultsContent');
    
    resultsContent.innerHTML = htmlContent;
    resultsSection.style.display = 'block';
    
    // Auto-masquer après 10 secondes si succès
    if (htmlContent.includes('success')) {
        setTimeout(() => {
            resultsSection.style.display = 'none';
        }, 10000);
    }
}

/**
 * Met à jour le sélecteur de table avec les métadonnées Python
 */
function updateTableSelector() {
    const tableSelect = document.getElementById('targetTable');
    tableSelect.innerHTML = '<option value="">Sélectionner...</option>';
    
    // Ajouter les tables depuis availableTables (Grist API)
    availableTables.forEach(table => {
        const option = document.createElement('option');
        option.value = table;
        option.textContent = `${table} (Grist)`;
        tableSelect.appendChild(option);
    });
    
    // Ajouter les tables depuis les métadonnées Python
    Object.keys(tableColumns).forEach(tableName => {
        const tableId = tableNameToId[tableName];
        const columnCount = tableColumns[tableName].length;
        
        const option = document.createElement('option');
        option.value = tableName;
        option.textContent = `${tableName} (${columnCount} colonnes - ID:${tableId})`;
        tableSelect.appendChild(option);
    });
    
    console.log("Sélecteur de table mis à jour:", 
        availableTables.length, "tables Grist +", 
        Object.keys(tableColumns).length, "tables Python");
}

/**
 * Charge la liste des tables disponibles dans le sélecteur
 */
async function loadAvailableTables() {
    try {
        const tables = await grist.docApi.listTables();
        availableTables = tables;
        
        updateTableSelector();
        
        console.log("Tables Grist chargées:", tables);
        
    } catch (error) {
        console.error("Erreur lors du chargement des tables:", error);
        updateStatus('error', 'Erreur de chargement des tables');
    }
}

/**
 * Fonction utilitaire pour s'assurer que le DOM est chargé
 */
function ready(fn) {
    if (document.readyState !== 'loading') { 
        fn(); 
    } else { 
        document.addEventListener('DOMContentLoaded', fn); 
    }
}

/**
 * Fonction de debounce pour optimiser les performances
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}