// ================================================================================
// GESTIONNAIRE DE BOUTONS PERSONNALISÉS
// ================================================================================

/**
 * Gestionnaire pour la sauvegarde et récupération des boutons personnalisés
 * Utilise la colonne buttonconfig avec format JSON
 */
class ButtonManager {
    
    /**
     * Lit la configuration des boutons depuis un enregistrement
     * @param {Object} record - Enregistrement Grist contenant la configuration
     * @returns {Array} - Tableau des boutons ou tableau vide
     */
    static readButtonConfig(record) {
        try {
            if (!buttonConfigField || !record || !record[buttonConfigField]) {
                console.log("Aucune configuration de boutons trouvée");
                return [];
            }
            
            const configText = record[buttonConfigField];
            if (typeof configText !== 'string' || configText.trim() === '') {
                console.log("Configuration de boutons vide");
                return [];
            }
            
            const config = JSON.parse(configText);
            if (!Array.isArray(config)) {
                console.warn("Configuration de boutons invalide (pas un tableau):", config);
                return [];
            }
            
            console.log(`${config.length} boutons trouvés dans la configuration`);
            return config;
            
        } catch (error) {
            console.error("Erreur lors de la lecture de la configuration des boutons:", error);
            return [];
        }
    }
    
    /**
     * Sauvegarde la configuration des boutons dans un enregistrement
     * @param {Object} record - Enregistrement Grist à modifier
     * @param {Array} buttonsConfig - Tableau des boutons à sauvegarder
     * @returns {Promise<boolean>} - true si succès, false sinon
     */
    static async saveButtonConfig(record, buttonsConfig) {
        try {
            if (!buttonConfigField) {
                console.error("Champ buttonconfig non configuré");
                return false;
            }
            
            if (!record || !record.id) {
                console.error("Enregistrement invalide pour la sauvegarde");
                return false;
            }
            
            if (!Array.isArray(buttonsConfig)) {
                console.error("Configuration des boutons doit être un tableau");
                return false;
            }
            
            // Convertir en JSON
            const configJSON = JSON.stringify(buttonsConfig, null, 0);
            console.log("Sauvegarde de la configuration des boutons:", configJSON.substring(0, 100) + "...");
            
            // Sauvegarder via l'API Grist
            await grist.selectedTable.update({
                id: record.id,
                fields: {[buttonConfigField]: configJSON}
            });
            
            console.log("Configuration des boutons sauvegardée avec succès");
            return true;
            
        } catch (error) {
            console.error("Erreur lors de la sauvegarde de la configuration des boutons:", error);
            return false;
        }
    }
    
    /**
     * Ajoute un nouveau bouton à la configuration existante
     * @param {Object} record - Enregistrement Grist
     * @param {Object} newButton - Nouveau bouton à ajouter {name: string, sequence: number[]}
     * @returns {Promise<boolean>} - true si succès, false sinon
     */
    static async addButton(record, newButton) {
        try {
            // Valider le nouveau bouton
            if (!newButton || !newButton.name || !Array.isArray(newButton.sequence)) {
                console.error("Nouveau bouton invalide:", newButton);
                return false;
            }
            
            // Lire la configuration existante
            const existingConfig = this.readButtonConfig(record);
            
            // Vérifier si un bouton avec le même nom existe déjà
            const existingIndex = existingConfig.findIndex(btn => btn.name === newButton.name);
            
            if (existingIndex >= 0) {
                // Remplacer le bouton existant
                existingConfig[existingIndex] = newButton;
                console.log(`Bouton "${newButton.name}" mis à jour`);
            } else {
                // Ajouter le nouveau bouton
                existingConfig.push(newButton);
                console.log(`Nouveau bouton "${newButton.name}" ajouté`);
            }
            
            // Sauvegarder la configuration mise à jour
            return await this.saveButtonConfig(record, existingConfig);
            
        } catch (error) {
            console.error("Erreur lors de l'ajout du bouton:", error);
            return false;
        }
    }
    
    /**
     * Supprime un bouton de la configuration
     * @param {Object} record - Enregistrement Grist
     * @param {string} buttonName - Nom du bouton à supprimer
     * @returns {Promise<boolean>} - true si succès, false sinon
     */
    static async removeButton(record, buttonName) {
        try {
            if (!buttonName) {
                console.error("Nom du bouton requis pour suppression");
                return false;
            }
            
            // Lire la configuration existante
            const existingConfig = this.readButtonConfig(record);
            
            // Filtrer pour supprimer le bouton
            const updatedConfig = existingConfig.filter(btn => btn.name !== buttonName);
            
            if (updatedConfig.length === existingConfig.length) {
                console.warn(`Bouton "${buttonName}" non trouvé pour suppression`);
                return false;
            }
            
            console.log(`Bouton "${buttonName}" supprimé`);
            
            // Sauvegarder la configuration mise à jour
            return await this.saveButtonConfig(record, updatedConfig);
            
        } catch (error) {
            console.error("Erreur lors de la suppression du bouton:", error);
            return false;
        }
    }
    
    /**
     * Valide qu'un bouton n'a pas d'IDs cassés
     * @param {Object} button - Bouton à valider {name: string, sequence: number[]}
     * @param {Array} allRecords - Tous les enregistrements disponibles
     * @returns {Object} - {isValid: boolean, missingIds: number[], validIds: number[]}
     */
    static validateButton(button, allRecords) {
        try {
            if (!button || !Array.isArray(button.sequence)) {
                return { isValid: false, missingIds: [], validIds: [] };
            }
            
            const existingIds = new Set(allRecords.map(record => record.id));
            const validIds = [];
            const missingIds = [];
            
            button.sequence.forEach(id => {
                if (existingIds.has(id)) {
                    validIds.push(id);
                } else {
                    missingIds.push(id);
                }
            });
            
            const isValid = missingIds.length === 0;
            
            if (!isValid) {
                console.warn(`Bouton "${button.name}" a des IDs manquants:`, missingIds);
            }
            
            return { isValid, missingIds, validIds };
            
        } catch (error) {
            console.error("Erreur lors de la validation du bouton:", error);
            return { isValid: false, missingIds: [], validIds: [] };
        }
    }
    
    /**
     * Nettoie les IDs cassés d'un bouton
     * @param {Object} button - Bouton à nettoyer
     * @param {Array} allRecords - Tous les enregistrements disponibles
     * @returns {Object} - Bouton nettoyé avec seulement les IDs valides
     */
    static cleanButton(button, allRecords) {
        try {
            const validation = this.validateButton(button, allRecords);
            
            return {
                ...button,
                sequence: validation.validIds
            };
            
        } catch (error) {
            console.error("Erreur lors du nettoyage du bouton:", error);
            return button;
        }
    }
}

// Rendre disponible globalement
window.ButtonManager = ButtonManager;

// Export pour utilisation dans d'autres scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ButtonManager };
}