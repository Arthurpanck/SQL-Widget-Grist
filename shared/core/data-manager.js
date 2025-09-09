"use strict";

// ================================================================================
// VARIABLES GLOBALES
// ================================================================================
let oldRecord = null;
let sqlField = null;
let pythonfield = null;
let requestNameField = null;
let buttonConfigField = null;
let editor = null;
let availableTables = [];
let tableColumnsData = {};
let allRecords = []; // Pour stocker tous les enregistrements

// NOUVEAUX MAPPINGS POUR LA GESTION ID/LABEL
let tableIdToName = {}; // {table_id: "table_name"}
let tableNameToId = {}; // {"table_name": table_id}
let columnIdToLabel = {}; // {column_id: "column_label"}
let columnLabelToId = {}; // {"table_name.column_label": column_id}
let tableColumns = {}; // {"table_name": [{id, label}, ...]}

// ================================================================================
// SECTION: PARSING PYTHON & GESTION DES MAPPINGS ID/LABEL
// ================================================================================

/**
 * Parse le contenu JSON de la colonne Python pour extraire tables et colonnes
 * Supporte l'ancien et le nouveau format
 */
function parsePythonTableData(pythonData) {
    try {
        // Gérer le cas où il n'y a pas de données
        if (!pythonData || (typeof pythonData === 'string' && pythonData.trim() === '')) {
            console.log("Aucune donnée Python fournie ou champ vide.");
            return {};
        }

        let parsedData;
        
        // Si les données sont déjà un objet
        if (typeof pythonData === 'object') {
            parsedData = pythonData;
        } else if (typeof pythonData === 'string') {
            parsedData = JSON.parse(pythonData);
        } else {
            console.warn("Format de données Python inattendu:", typeof pythonData);
            return {};
        }

        // Détecter le format des données
        if (parsedData.tables && Array.isArray(parsedData.tables)) {
            // NOUVEAU FORMAT avec IDs
            console.log("Nouveau format détecté avec IDs");
            return parseNewFormat(parsedData);
        } else {
            // ANCIEN FORMAT sans IDs
            console.log("Ancien format détecté, conversion automatique");
            return parseOldFormat(parsedData);
        }

    } catch (error) {
        console.error("Erreur critique lors du parsing des métadonnées Python:", error);
        console.error("Données problématiques:", pythonData); 
        return {};
    }
}

/**
 * Parse le nouveau format avec IDs
 */
function parseNewFormat(data) {
    // Réinitialiser les mappings
    tableIdToName = {};
    tableNameToId = {};
    columnIdToLabel = {};
    columnLabelToId = {};
    tableColumns = {};
    
    data.tables.forEach(table => {
        const tableName = table.table_name;
        const tableId = table.table_id;
        
        // Mapping des tables
        tableIdToName[tableId] = tableName;
        tableNameToId[tableName] = tableId;
        
        // Traiter les colonnes
        tableColumns[tableName] = table.columns || [];
        
        table.columns.forEach(column => {
            const columnId = column.id;
            const columnLabel = column.label;
            
            // Mapping des colonnes
            columnIdToLabel[columnId] = columnLabel;
            columnLabelToId[`${tableName}.${columnLabel}`] = columnId;
        });
    });
    
    console.log("Mappings créés:", {
        tables: Object.keys(tableColumns).length,
        columns: Object.keys(columnIdToLabel).length
    });
    
    return tableColumns;
}

/**
 * Parse l'ancien format et génère des IDs fictifs
 */
function parseOldFormat(data) {
    // Réinitialiser les mappings
    tableIdToName = {};
    tableNameToId = {};
    columnIdToLabel = {};
    columnLabelToId = {};
    tableColumns = {};
    
    let tableIdCounter = 1000; // IDs fictifs pour l'ancien format
    let columnIdCounter = 10000;
    
    Object.keys(data).forEach(tableName => {
        const columns = data[tableName];
        const tableId = tableIdCounter++;
        
        // Mapping des tables
        tableIdToName[tableId] = tableName;
        tableNameToId[tableName] = tableId;
        
        // Traiter les colonnes
        tableColumns[tableName] = columns.map(columnLabel => {
            const columnId = columnIdCounter++;
            
            // Mapping des colonnes
            columnIdToLabel[columnId] = columnLabel;
            columnLabelToId[`${tableName}.${columnLabel}`] = columnId;
            
            return { id: columnId, label: columnLabel };
        });
    });
    
    console.log("Conversion ancien format terminée:", {
        tables: Object.keys(tableColumns).length,
        columns: Object.keys(columnIdToLabel).length
    });
    
    return tableColumns;
}