# SciNote — Rich Text Editor for Scientists

## Overview
A Notion-inspired block-based rich text editor built for scientists and R&D engineers. Features block-based content creation, slash commands, inline formatting, drag-and-drop reordering, dark mode, document search, favorites, templates, and export.

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
    home.tsx           - Welcome page with quick-start templates and keyboard shortcuts
    editor.tsx         - Document editor with word count, PDF/MD export
  components/
    doc-sidebar.tsx    - Document list with favorites, duplicate, search modal trigger
    block-editor.tsx   - Core block editor with undo/redo, smart list continuation
    block-item.tsx     - Individual block rendering with markdown shortcuts, keyboard formatting
    slash-command-menu.tsx - "/" command palette with categories (Basic/Advanced blocks)
    inline-toolbar.tsx - Floating toolbar for text formatting
    table-block.tsx    - Editable table component with add/remove rows/columns
    search-modal.tsx   - Full-text search modal (Ctrl+P)
    theme-provider.tsx - Dark/light mode context provider
  lib/
    export.ts          - Markdown export with table/image support

server/
  index.ts             - Express server entry
  routes.ts            - API routes: CRUD + search, duplicate, favorite toggle
  storage.ts           - Database storage with search, duplicate, favorite methods
  db.ts                - Drizzle database connection
  seed.ts              - Sample scientific documents seeder

shared/
  schema.ts            - Drizzle schemas with isFavorite, table/image block types
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

## Design Tokens
- Font: Inter (sans), JetBrains Mono (code)
- Colors follow Notion's palette: #37352F text, #787774 muted, #FFFFFF bg, #F7F6F3 hover, #2EAADC accent
- Max-width 900px centered content area
- Dark mode CSS variables defined in index.css .dark class

## API Endpoints
- GET /api/documents - List all documents
- GET /api/documents/search?q=query - Full-text search across title and blocks
- GET /api/documents/:id - Get single document
- POST /api/documents - Create document
- POST /api/documents/:id/duplicate - Duplicate document
- POST /api/documents/:id/favorite - Toggle favorite status
- PATCH /api/documents/:id - Update document
- DELETE /api/documents/:id - Delete document

## Important Notes
- Block content stored as raw HTML innerHTML (from contentEditable)
- Blocks saved as JSONB array in PostgreSQL
- Table data stored in block.meta.tableData as string[][]
- Image data stored as base64 data URL in block.content
- ContentEditable elements need `dir="ltr"` to prevent RTL rendering
- Never add `hover:bg-*` classes to buttons; use hover-elevate system
- Rules of Hooks: all hooks must be before any early returns
- No emoji in UI — use lucide-react icons (seed data emoji for doc icons is acceptable)
