# SciNote — Rich Text Editor for Scientists

## Overview
A Notion-inspired block-based rich text editor built for scientists and R&D engineers. Features block-based content creation, slash commands, inline formatting, drag-and-drop reordering, dark mode, document search, favorites, templates, export, project/tag organization, dashboard with calendar/project views, and document version history.

## Architecture
- **Frontend**: React + TypeScript with Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js API server
- **Database**: PostgreSQL (Drizzle ORM)
- **Routing**: wouter for client-side routing

## Project Structure
```
client/src/
  App.tsx              - Main app with ThemeProvider, sidebar + editor layout
  pages/
    home.tsx           - Dashboard with calendar view, project view, recent docs, templates
    editor.tsx         - Document editor with metadata bar, version history, status bar
  components/
    doc-sidebar.tsx    - Collapsible sidebar (260px/56px) with 6 nav sections: Dashboard, Workspaces, Favorites, Projects, Documents, Tags; 3-dot context menus on workspace/project items (rename, delete)
    workspace-manager.tsx - Modal to create/delete workspaces
    block-editor.tsx   - Core block editor with undo/redo, smart list continuation
    block-item.tsx     - Individual block rendering with markdown shortcuts, keyboard formatting
    slash-command-menu.tsx - "/" command palette with categories
    inline-toolbar.tsx - Floating toolbar for text formatting
    table-block.tsx    - Editable table component
    search-modal.tsx   - Full-text search modal (Ctrl+P)
    theme-provider.tsx - Dark/light mode context provider
    calendar-view.tsx  - Monthly calendar grid showing document activity
    project-view.tsx   - Project cards with nested documents, create project
    doc-card.tsx       - Reusable document card with project/tag/date display
    doc-metadata.tsx   - Project selector, tag pills, created/modified dates
    version-panel.tsx  - Slide-out version history with save/restore
    project-manager.tsx - Modal to create/delete projects
    tag-manager.tsx    - Modal to create/delete tags
  lib/
    export.ts          - Markdown export with table/image support

server/
  index.ts             - Express server entry
  routes.ts            - API routes: documents, projects, tags, versions
  storage.ts           - Database storage with all CRUD operations
  db.ts                - Drizzle database connection
  seed.ts              - Sample scientific documents seeder

shared/
  schema.ts            - Drizzle schemas: documents, projects, tags, documentTags, documentVersions
```

## Key Features
- Block types: text, heading 1/2/3, bulleted list, numbered list, code, quote, callout, divider, table, image
- Slash commands with categories (Basic + Advanced blocks)
- Markdown shortcuts: # /## /### for headings, - /* for lists, > for quote, --- for divider, ``` for code
- Inline formatting: Bold, italic, underline, strikethrough, code, highlight, links
- Keyboard shortcuts: Ctrl+B/I/U/E/K, Ctrl+Shift+S/H, Ctrl+Z/Y
- Smart list continuation (Enter continues list, empty Enter exits)
- Undo/redo system (50-state history stack)
- Drag-and-drop with above/below drop indicators
- Dark mode toggle with localStorage persistence
- Document favorites with pinned sidebar section
- Duplicate document
- Full-text search modal (Ctrl+P) searching title + block content
- Word count, character count, reading time status bar
- Export: Markdown (.md) download and Print/PDF
- Quick-start templates: Lab Report, Protocol, Meeting Notes, Research Log
- Auto-save with debounced persistence
- **Dashboard**: Calendar view (monthly grid showing doc activity), Projects view (grouped docs)
- **Projects**: Color-coded project organization, assign docs to projects
- **Tags**: Color-coded tags, assign multiple tags per doc, filter by tag in sidebar
- **Version History**: Save snapshots, browse history, restore previous versions
- **Metadata Bar**: Project selector, tag pills, created/modified dates in editor
- **Status Bar**: Save status indicator, version number, workspace name, project name
- **Workspaces**: Top-level organizational layer above projects; assign projects and documents to workspaces; sidebar section with nested hierarchy; dashboard workspace filter

## Design Tokens
- Font: Inter (sans), JetBrains Mono (code)
- Colors follow Notion's palette: #37352F text, #787774 muted, #FFFFFF bg, #F7F6F3 hover, #2EAADC accent
- Max-width 900px centered content area
- Dark mode CSS variables defined in index.css .dark class

## Database Schema
- `workspaces` - id, name (unique), color, description, createdAt
- `documents` - id, title, blocks (jsonb), icon, coverColor, isFavorite, projectId, workspaceId, version, updatedAt, createdAt, sortOrder
- `projects` - id, name (unique), color, description, workspaceId, createdAt
- `tags` - id, name (unique), color
- `documentTags` - documentId, tagId (composite PK)
- `documentVersions` - id, documentId, version, title, blocks (jsonb), createdAt

## API Endpoints
- GET /api/documents - List all documents
- GET /api/documents/search?q=query - Full-text search
- GET /api/documents/:id - Get single document
- GET /api/documents/:id/tags - Get document's tags
- GET /api/documents/:id/versions - List version history
- POST /api/documents - Create document
- POST /api/documents/:id/duplicate - Duplicate document
- POST /api/documents/:id/favorite - Toggle favorite
- POST /api/documents/:id/versions - Save version snapshot
- POST /api/documents/:id/versions/:version/restore - Restore version
- PATCH /api/documents/:id - Update document (accepts projectId, workspaceId, tagIds)
- DELETE /api/documents/:id - Delete document
- GET /api/workspaces - List workspaces
- POST /api/workspaces - Create workspace
- PATCH /api/workspaces/:id - Update workspace
- DELETE /api/workspaces/:id - Delete workspace (unassigns projects/documents)
- GET /api/projects - List projects
- POST /api/projects - Create project (accepts workspaceId)
- PATCH /api/projects/:id - Update project (accepts workspaceId)
- DELETE /api/projects/:id - Delete project
- GET /api/tags - List tags
- POST /api/tags - Create tag
- DELETE /api/tags/:id - Delete tag

## Important Notes
- Block content stored as raw HTML innerHTML (from contentEditable)
- Blocks saved as JSONB array in PostgreSQL
- Table data stored in block.meta.tableData as string[][]
- Image data stored as base64 data URL in block.content
- ContentEditable elements need `dir="ltr"` to prevent RTL rendering
- Never add `hover:bg-*` classes to buttons; use hover-elevate system
- Rules of Hooks: all hooks must be before any early returns
- No emoji in UI — use lucide-react icons (seed data emoji for doc icons is acceptable)
- `apiRequest(method, url, data)` pattern for all API calls
- `updateBlocksSilent` for content edits; `updateBlocks` for structural changes
