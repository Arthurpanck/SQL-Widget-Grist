// ================================================================================
// NAVIGATION COMPONENT - Navigation between pages with tabs
// ================================================================================

/**
 * Configuration des pages de navigation
 */
const NAVIGATION_PAGES = {
    'sql-editor': {
        name: 'Créateur de requête',
        path: '../sql-editor/index.html',
        description: 'Créer et tester des requêtes SQL'
    },
    'button-flow-editor': {
        name: 'Créateur de bouton', 
        path: '../button-flow-editor/index.html',
        description: 'Assembler des boutons avec séquences de requêtes'
    },
    'button-selection-page': {
        name: 'Liste bouton',
        path: '../button-selection-page/index.html',
        description: 'Sélectionner un bouton à exécuter'
    }
};

/**
 * Crée et insère la navigation dans la page
 * @param {string} currentPage - Identifiant de la page actuelle
 * @param {string} containerId - ID du conteneur où insérer la navigation (optionnel)
 */
function createNavigation(currentPage, containerId = null) {
    const navHTML = `
        <nav class="bg-white border-b border-gray-200 mb-6">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex space-x-8">
                    ${Object.entries(NAVIGATION_PAGES).map(([pageId, pageInfo]) => {
                        const isActive = pageId === currentPage;
                        const activeClasses = isActive 
                            ? 'border-teal-500 text-teal-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
                        
                        return `
                            <a class="${activeClasses} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm cursor-pointer" 
                               onclick="navigateToPage('${pageId}')"
                               title="${pageInfo.description}">
                                ${pageInfo.name}
                            </a>
                        `;
                    }).join('')}
                </div>
            </div>
        </nav>
    `;

    // Insérer la navigation
    if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = navHTML;
        } else {
            console.warn(`Container ${containerId} non trouvé pour la navigation`);
        }
    } else {
        // Insérer au début du body par défaut
        document.body.insertAdjacentHTML('afterbegin', navHTML);
    }

    console.log(`Navigation créée pour la page: ${currentPage}`);
}

/**
 * Navigation vers une page
 * @param {string} pageId - Identifiant de la page de destination
 */
function navigateToPage(pageId) {
    const pageInfo = NAVIGATION_PAGES[pageId];
    if (pageInfo) {
        console.log(`Navigation vers: ${pageInfo.name}`);
        window.location.href = pageInfo.path;
    } else {
        console.error(`Page inconnue: ${pageId}`);
    }
}

/**
 * Initialise la navigation automatiquement basée sur l'URL actuelle
 */
function initializeNavigation() {
    // Détecter la page actuelle basée sur l'URL
    const currentPath = window.location.pathname;
    let currentPage = 'sql-editor'; // par défaut

    if (currentPath.includes('sql-editor')) {
        currentPage = 'sql-editor';
    } else if (currentPath.includes('button-flow-editor')) {
        currentPage = 'button-flow-editor';
    } else if (currentPath.includes('button-selection-page')) {
        currentPage = 'button-selection-page';
    }

    // Créer la navigation
    createNavigation(currentPage);
}

/**
 * Ajoute la navigation dans un container spécifique
 * @param {string} currentPage - Page actuelle
 * @param {string} containerId - ID du container
 */
function addNavigationToContainer(currentPage, containerId) {
    createNavigation(currentPage, containerId);
}

/**
 * Crée une navigation compacte pour intégration dans l'interface (haut à droite)
 * @param {string} currentPage - Page actuelle
 * @returns {string} - HTML de la navigation compacte
 */
function createCompactNavigation(currentPage) {
    // Vérifier que la page existe
    if (!NAVIGATION_PAGES[currentPage]) {
        console.warn('Page inconnue:', currentPage);
        currentPage = 'sql-editor'; // fallback
    }
    
    // Créer tous les boutons dans l'ordre, avec le bouton actuel différencié
    const allPages = ['sql-editor', 'button-flow-editor', 'button-selection-page'];
    
    const navHTML = `
        <div class="flex items-center space-x-1">
            ${allPages.map(pageId => {
                const pageInfo = NAVIGATION_PAGES[pageId];
                const isActive = pageId === currentPage;
                
                if (isActive) {
                    return `<span class="px-3 py-1 text-sm font-medium text-teal-600 bg-teal-50 rounded border border-teal-200 min-w-[120px] text-center">${pageInfo.name}</span>`;
                } else {
                    return `<button onclick="navigateToPage('${pageId}')" 
                                    class="px-3 py-1 text-sm font-medium bg-gray-100 hover:bg-teal-100 text-gray-600 hover:text-teal-700 rounded border border-gray-200 hover:border-teal-200 transition-all min-w-[120px]"
                                    title="${pageInfo.description}">
                                ${pageInfo.name}
                            </button>`;
                }
            }).join('')}
        </div>
    `;
    
    return navHTML;
}

/**
 * Ajoute la navigation compacte dans un container
 * @param {string} currentPage - Page actuelle  
 * @param {string} containerId - ID du container
 */
function addCompactNavigationToContainer(currentPage, containerId) {
    console.log(`Tentative création navigation compacte - Page: ${currentPage}, Container: ${containerId}`);
    
    const container = document.getElementById(containerId);
    if (container) {
        const navHTML = createCompactNavigation(currentPage);
        container.innerHTML = navHTML;
        console.log(`✅ Navigation compacte créée pour: ${currentPage}`);
        console.log(`HTML inséré:`, navHTML);
    } else {
        console.error(`❌ Container ${containerId} non trouvé pour la navigation compacte`);
        // Fallback - injecter dans le body en position absolue pour debug
        document.body.insertAdjacentHTML('afterbegin', `
            <div style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: yellow; padding: 5px; border: 2px solid red;">
                DEBUG: Container "${containerId}" introuvable<br>
                ${createCompactNavigation(currentPage)}
            </div>
        `);
    }
}

// Export des fonctions pour usage global
window.createNavigation = createNavigation;
window.navigateToPage = navigateToPage;
window.initializeNavigation = initializeNavigation;
window.addNavigationToContainer = addNavigationToContainer;
window.createCompactNavigation = createCompactNavigation;
window.addCompactNavigationToContainer = addCompactNavigationToContainer;