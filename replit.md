# SciNote — Rich Text Editor for Scientists

## Overview
A Notion-inspired block-based rich text editor built for scientists and R&D engineers. Features block-based content creation, slash commands, inline formatting, and drag-and-drop reordering.

## Architecture
- **Frontend**: React + TypeScript with Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js API server
- **Database**: PostgreSQL (Drizzle ORM)
- **Routing**: wouter for client-side routing

## Project Structure
```
client/src/
  App.tsx              - Main app with sidebar + editor layout
  pages/
    home.tsx           - Welcome/landing page
    editor.tsx         - Document editor page
  components/
    doc-sidebar.tsx    - Document list sidebar with search
    block-editor.tsx   - Core block editor orchestrator
    block-item.tsx     - Individual block rendering (text, headings, lists, code, etc.)
    slash-command-menu.tsx - "/" command palette for block type selection
    inline-toolbar.tsx - Floating toolbar for text formatting (bold, italic, etc.)

server/
  index.ts             - Express server entry
  routes.ts            - API routes with Zod validation
  storage.ts           - Database storage interface
  db.ts                - Drizzle database connection
  seed.ts              - Sample scientific documents seeder

shared/
  schema.ts            - Drizzle schemas, Zod validators, TypeScript types
```

## Key Features
- Block types: text, heading 1/2/3, bulleted list, numbered list, code, quote, callout, divider
- Slash commands: Type "/" to insert block types
- Inline formatting: Bold, italic, underline, strikethrough, code, highlight, links
- Drag-and-drop block reordering
- Auto-save with debounced persistence
- Document CRUD with sidebar navigation

## Design Tokens
- Font: Inter (sans), JetBrains Mono (code)
- Colors follow Notion's palette: #37352F text, #787774 muted, #FFFFFF bg, #F7F6F3 hover, #2EAADC accent
- Max-width 900px centered content area

## API Endpoints
- GET /api/documents - List all documents
- GET /api/documents/:id - Get single document
- POST /api/documents - Create document
- PATCH /api/documents/:id - Update document
- DELETE /api/documents/:id - Delete document
