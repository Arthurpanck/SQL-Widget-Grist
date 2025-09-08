// ================================================================================
// SECTION: INITIALISATION DE L'ÉDITEUR ACE
// ================================================================================

/**
 * Initialise l'éditeur Ace avec la configuration SQL
 */
function loadAceEditor() {
    try {
        editor = ace.edit("editor");
        
        // Configuration du thème et du mode
        editor.setTheme("ace/theme/Eclipse");
        editor.session.setMode("ace/mode/sql");
        
        // Configuration de l'éditeur
        editor.setFontSize(14);
        editor.session.setTabSize(2);
        editor.setOption("wrap", true);
        
        // Autocomplétion
        editor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true,
            showLineNumbers: true,
            showGutter: true,
            highlightActiveLine: true
        });

        // Ajout de mots-clés SQL personnalisés pour l'autocomplétion
        const sqlCompleter = {
            getCompletions: function(editor, session, pos, prefix, callback) {
                console.log("DEBUT autocomplétion - tables disponibles:", Object.keys(tableColumns));
                
                const sqlKeywords = [
                    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE',
                    'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
                    'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT',
                    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
                    'DISTINCT', 'AS', 'AND', 'OR', 'NOT', 'IN', 'LIKE'
                ];
                
                const completions = sqlKeywords.map(keyword => ({
                    caption: keyword,
                    value: keyword,
                    meta: "SQL"
                }));
                
                // Ajouter les noms de tables disponibles (depuis Grist API)
                availableTables.forEach(table => {
                    completions.push({
                        caption: table,
                        value: table,
                        meta: "table-grist"
                    });
                });
                
                // Ajouter les tables depuis les métadonnées Python (nouveau format)
                Object.keys(tableColumns).forEach(tableName => {
                    const tableId = tableNameToId[tableName];
                    completions.push({
                        caption: tableName,
                        value: tableName,
                        meta: "table",
                        docHTML: `<b>Table: ${tableName}</b><br>ID: ${tableId}<br>Colonnes: ${tableColumns[tableName].length}`
                    });
                });
                
                // Ajouter les colonnes de toutes les tables Python
                Object.keys(tableColumns).forEach(tableName => {
                    if (Array.isArray(tableColumns[tableName])) {
                        tableColumns[tableName].forEach(column => {
                            // Ajouter la colonne simple
                            completions.push({
                                caption: column.label,
                                value: column.label,
                                meta: `col: ${tableName}`,
                                docHTML: `<b>Colonne: ${column.label}</b><br>Table: ${tableName}<br>ID: ${column.id}`
                            });
                            
                            // Ajouter avec le format table.colonne
                            completions.push({
                                caption: `${tableName}.${column.label}`,
                                value: `${tableName}.${column.label}`,
                                meta: "qualified",
                                docHTML: `<b>${tableName}.${column.label}</b><br>Table ID: ${tableNameToId[tableName]}<br>Column ID: ${column.id}`
                            });
                        });
                    }
                });
                
                console.log(`Total completions générées: ${completions.length}`);
                callback(null, completions);
            }
        };
        
        editor.completers.push(sqlCompleter);
        
        // Événement de changement pour activer le bouton de sauvegarde
        editor.on('change', function() {
            if (oldRecord && !document.getElementById('saveBtn').disabled) {
                updateStatus('modified', 'Modifié - Sauvegarde nécessaire');
            }
        });

        console.log("Éditeur Ace initialisé avec succès");
        updateStatus('ready', 'Éditeur prêt');
        
    } catch (error) {
        console.error("Erreur lors de l'initialisation de l'éditeur Ace:", error);
        updateStatus('error', 'Erreur d\'initialisation de l\'éditeur');
    }
}