# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SQL-Widget-Grist is a Grist widget that provides an advanced SQL query interface with custom button workflows. It's a pure HTML/JavaScript project (no build system) designed to run as a Grist widget.

## Development Commands

Since this is a static HTML/JavaScript project, development is done by:
- Opening the HTML files directly in a browser for testing
- Using the test files (`test-*.html`) to verify specific functionality
- No build, lint, or test runners are configured

## Architecture Overview

### Core Architecture Pattern

The project uses a **shared module architecture** where core functionality is centralized in `/shared/` and imported by all components:

- **shared/core/**: Business logic (ButtonManager, GristConnector, SqlConverter, DataManager)
- **shared/ui/**: UI components (Navigation, QuerySelector, UIHelpers)
- Each page component imports only what it needs from shared modules

### Data Flow Architecture

1. **Grist Integration**: All data flows through `grist-connector.js` which handles:
   - Column mappings (sqlField, pythonfield, requestNameField, buttonConfigField, destinationTableField)
   - Record selection and updates via Grist API
   - Automatic detection of available functions (updateQueriesDisplay vs updateQuerySelector)

2. **SQL Conversion System**: Bidirectional conversion between human-readable labels and Grist IDs:
   - Storage: `[TABLE:123].[COL:456]` format
   - Display: `table_name.column_name` format
   - Handles qualified references (`table.column`) before individual names

3. **Button Management**: JSON-based workflow system:
   - Format: `[{"name": "Button Name", "sequence": [1, 2, 3]}]`
   - Stored in `buttonconfig` column as JSON string
   - ButtonManager handles CRUD operations with validation

### Component Communication

- **localStorage**: Transfer data between pages (selectedButton, navigation state)
- **Global variables**: Shared state (allRecords, mappings) managed by grist-connector
- **Event-driven**: Components detect available functions and adapt behavior

### Key Architectural Constraints

- **No build system**: All code must work directly in browser
- **Grist widget requirements**: Must use `grist.ready()` with proper column mappings
- **Cross-page persistence**: Uses localStorage since each page is separate HTML file
- **Backwards compatibility**: SQL conversion handles both old and new table metadata formats

### Workflow Implementation

The application implements a 4-page workflow:
1. **sql-editor**: Create/edit individual SQL queries
2. **button-flow-editor**: Drag & drop queries to create button sequences  
3. **button-selection-page**: Choose from saved buttons
4. **view-user-page**: Execute selected button with step-by-step progress

### Critical Dependencies

- **Ace Editor**: For SQL syntax highlighting (loaded via CDN)
- **Tailwind CSS**: For styling (loaded via CDN)
- **Material Icons**: For UI icons (loaded via CDN)
- **Grist API**: Widget requires full access (`requiredAccess: 'full'`)

### Testing Strategy

Test files demonstrate complete workflows:
- `test-full-workflow.html`: Complete navigation and feature overview
- `test-button-flow-editor.html`: Drag & drop functionality
- `test-navigation.html`: Page navigation system
- Other test files focus on specific features

When modifying code, always test the complete workflow using the test files to ensure cross-component integration works correctly.