// ================================================================================
// SYSTÈME DE NAVIGATION ENTRE LES PAGES GRIST WIDGET
// ================================================================================

/**
 * Système de navigation bidirectionnel entre button-flow-editor et sql-editor
 */
class PageNavigation {
    constructor() {
        this.pages = {
            'button-flow-editor': '../button-flow-editor/index.html',
            'sql-editor': '../sql-editor/index.html'
        };
        
        // Détecter la page actuelle à partir de l'URL
        this.currentPage = this.detectCurrentPage();
        
        console.log('Navigation initialisée - Page actuelle:', this.currentPage);
    }
    
    /**
     * Détecte la page actuelle à partir de l'URL
     */
    detectCurrentPage() {
        const path = window.location.pathname;
        
        if (path.includes('button-flow-editor')) {
            return 'button-flow-editor';
        } else if (path.includes('sql-editor')) {
            return 'sql-editor';
        }
        
        // Par défaut, assumons button-flow-editor
        return 'button-flow-editor';
    }
    
    /**
     * Obtient la page de destination du toggle
     */
    getTargetPage() {
        return this.currentPage === 'button-flow-editor' ? 'sql-editor' : 'button-flow-editor';
    }
    
    /**
     * Obtient le label de la page de destination
     */
    getTargetLabel() {
        const targetPage = this.getTargetPage();
        return targetPage === 'sql-editor' ? 'Créateur de requête' : 'Créateur de bouton';
    }
    
    /**
     * Navigue vers la page de destination
     */
    navigate() {
        const targetPage = this.getTargetPage();
        const targetUrl = this.pages[targetPage];
        
        console.log(`Navigation vers ${targetPage}: ${targetUrl}`);
        
        // Préserver les paramètres URL si nécessaire
        const currentParams = window.location.search;
        const fullUrl = targetUrl + currentParams;
        
        // Effectuer la navigation
        window.location.href = fullUrl;
    }
    
    /**
     * Configure un toggle pour la navigation
     * @param {string} toggleId - ID de l'élément toggle
     * @param {string} labelId - ID de l'élément label (optionnel)
     */
    setupToggle(toggleId, labelId = null) {
        const toggle = document.getElementById(toggleId);
        const label = labelId ? document.getElementById(labelId) : null;
        
        if (!toggle) {
            console.error(`Toggle ${toggleId} non trouvé`);
            return;
        }
        
        // Mettre à jour le label si fourni
        if (label) {
            label.textContent = this.getTargetLabel();
        }
        
        // Configurer l'event listener
        toggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                console.log(`Toggle activé - navigation vers ${this.getTargetPage()}`);
                
                // Petit délai pour l'animation du toggle
                setTimeout(() => {
                    this.navigate();
                }, 200);
            }
        });
        
        console.log(`Toggle configuré pour naviguer vers: ${this.getTargetPage()}`);
    }
    
    /**
     * Méthode statique pour initialiser rapidement la navigation
     * @param {string} toggleId - ID de l'élément toggle
     * @param {string} labelId - ID de l'élément label (optionnel)
     */
    static init(toggleId, labelId = null) {
        const navigation = new PageNavigation();
        navigation.setupToggle(toggleId, labelId);
        return navigation;
    }
}

// Rendre disponible globalement
window.PageNavigation = PageNavigation;

// ================================================================================
// FONCTIONS D'AIDE POUR LA COMPATIBILITÉ
// ================================================================================

/**
 * Fonction d'aide pour initialiser rapidement la navigation
 * Compatible avec l'existant
 */
function initPageNavigation(toggleId = 'toggle', labelId = 'toggle-label') {
    return PageNavigation.init(toggleId, labelId);
}

// Export pour utilisation dans d'autres scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PageNavigation, initPageNavigation };
}