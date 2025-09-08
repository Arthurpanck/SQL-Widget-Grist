// ================================================================================
// SECTION: CONVERSION SQL LABELS/IDS
// ================================================================================

/**
 * Convertit une requête SQL avec des labels vers des IDs
 */
function convertSqlLabelsToIds(sqlQuery) {
    if (!sqlQuery) return sqlQuery;
    
    let convertedSql = sqlQuery;
    
    // ÉTAPE 1: Remplacer les références table.colonne par leurs IDs (AVANT les tables seules)
    Object.keys(columnLabelToId).forEach(qualifiedColumn => {
        const columnId = columnLabelToId[qualifiedColumn];
        const [tableName, columnLabel] = qualifiedColumn.split('.');
        const tableId = tableNameToId[tableName];
        
        // Remplacer table.colonne par [TABLE:id].[COL:id]
        const regex = new RegExp(`\\b${escapeRegex(tableName)}\\.${escapeRegex(columnLabel)}\\b`, 'gi');
        convertedSql = convertedSql.replace(regex, `[TABLE:${tableId}].[COL:${columnId}]`);
    });
    
    // ÉTAPE 2: Remplacer les noms de tables par leurs IDs
    Object.keys(tableNameToId).forEach(tableName => {
        const tableId = tableNameToId[tableName];
        // Utiliser une regex pour remplacer le nom de table par son ID
        const regex = new RegExp(`\\b${escapeRegex(tableName)}\\b`, 'gi');
        convertedSql = convertedSql.replace(regex, `[TABLE:${tableId}]`);
    });
    
    // ÉTAPE 3: Remplacer les colonnes individuelles par leurs IDs - MÊME LOGIQUE QUE LES TABLES
    const allColumnLabels = {};
    Object.keys(tableColumns).forEach(tableName => {
        tableColumns[tableName].forEach(column => {
            const columnLabel = column.label;
            const columnId = column.id;
            
            // Si plusieurs tables ont la même colonne, on garde la première trouvée
            if (!allColumnLabels[columnLabel]) {
                allColumnLabels[columnLabel] = columnId;
            }
        });
    });
    
    // EXACTEMENT la même logique que pour les tables !
    Object.keys(allColumnLabels).forEach(columnLabel => {
        const columnId = allColumnLabels[columnLabel];
        const regex = new RegExp(`\\b${escapeRegex(columnLabel)}\\b`, 'gi');
        convertedSql = convertedSql.replace(regex, `[COL:${columnId}]`);
    });
    
    console.log("SQL converti (labels → IDs):", convertedSql.substring(0, 200) + "...");
    return convertedSql;
}

/**
 * Convertit une requête SQL avec des IDs vers des labels
 */
function convertSqlIdsToLabels(sqlQuery) {
    if (!sqlQuery) return sqlQuery;
    
    let convertedSql = sqlQuery;
    
    // ÉTAPE 1: Remplacer les références [TABLE:id].[COL:id] par table.colonne (AVANT les conversions individuelles)
    const qualifiedRegex = /\[TABLE:(\d+)\]\.\[COL:(\d+)\]/g;
    convertedSql = convertedSql.replace(qualifiedRegex, (match, tableId, columnId) => {
        const tableName = tableIdToName[parseInt(tableId)];
        const columnLabel = columnIdToLabel[parseInt(columnId)];
        if (tableName && columnLabel) {
            return `${tableName}.${columnLabel}`;
        }
        return match; // Retourner l'original si pas trouvé
    });
    
    // ÉTAPE 2: Remplacer les IDs de tables par leurs noms
    const tableRegex = /\[TABLE:(\d+)\]/g;
    convertedSql = convertedSql.replace(tableRegex, (match, tableId) => {
        const tableName = tableIdToName[parseInt(tableId)];
        return tableName || match; // Retourner le nom ou l'ID original si pas trouvé
    });
    
    // ÉTAPE 3: Remplacer les IDs de colonnes par leurs labels
    const columnRegex = /\[COL:(\d+)\]/g;
    convertedSql = convertedSql.replace(columnRegex, (match, columnId) => {
        const columnLabel = columnIdToLabel[parseInt(columnId)];
        return columnLabel || match; // Retourner le label ou l'ID original si pas trouvé
    });
    
    console.log("SQL converti (IDs → labels):", convertedSql.substring(0, 100) + "...");
    return convertedSql;
}

/**
 * Échappe les caractères spéciaux pour les regex
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}