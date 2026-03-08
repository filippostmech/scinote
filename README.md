<p align="center">
  <img src="docs/scinote-logo.png" alt="SciNote Logo" width="180" />
</p>

<h1 align="center">SciNote</h1>

<p align="center">
  <strong>A block-based rich text editor for scientists and R&D engineers</strong><br>
  Organize lab notes, protocols, meeting agendas, and research logs with a Notion-inspired editing experience — workspaces, projects, tags, version history, and full-text search, all backed by PostgreSQL.
</p>

<p align="center">
  <a href="#features">Features</a> · <a href="#getting-started">Get Started</a> · <a href="#tech-stack">Tech Stack</a> · <a href="#api">API Reference</a> · <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-18-blue" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-14+-blue" alt="PostgreSQL" />
</p>

---

## Features

### Editor

- **11 block types** — text, heading (H1/H2/H3), bulleted list, numbered list, code, quote, callout, divider, table, image
- **Slash command menu** — type `/` to insert any block type, organized by category
- **Markdown shortcuts** — `#`, `##`, `###` for headings, `-` or `*` for lists, `>` for quotes, `---` for dividers, ` ``` ` for code blocks
- **Inline formatting toolbar** — bold, italic, underline, strikethrough, inline code, highlight, links
- **Keyboard shortcuts** — Ctrl+B/I/U/E/K, Ctrl+Shift+S/H, Ctrl+Z/Y
- **Smart list continuation** — Enter continues the list, empty Enter exits
- **Drag-and-drop** — reorder blocks with above/below drop indicators
- **Undo/redo** — 50-state history stack
- **Auto-save** — debounced persistence on every edit

### Organization

- **Workspaces** — top-level organizational layer; nest projects and documents inside workspaces
- **Projects** — color-coded project grouping; assign documents to projects
- **Tags** — color-coded tags; assign multiple tags per document
- **Favorites** — pin documents for quick access in the sidebar
- **Collapsible sidebar** — 6 navigation sections: Dashboard, Workspaces, Favorites, Projects, Documents, Tags

### Dashboard

- **Calendar view** — monthly grid showing document activity by day
- **Project view** — documents grouped by project with color-coded cards
- **Recent documents** — quick access to recently edited notes
- **Templates** — Lab Report, Protocol, Meeting Notes, Research Log starters

### History & Export

- **Version history** — save snapshots, browse previous versions, restore any version
- **Markdown export** — download documents as `.md` files with full table and image support
- **Print / PDF** — browser-native print dialog

### Search & Navigation

- **Full-text search** — Ctrl+P to search across titles and block content
- **Word count, character count, reading time** in the status bar
- **Metadata bar** — project selector, tag pills, created/modified dates

### Theming

- **Dark mode** — toggle with localStorage persistence
- **Highlighter theme** — Space Grotesk typography, sharp corners (0 border-radius), lime-green accent

---

## Tech Stack

| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Frontend   | React 18, TypeScript, Vite                      |
| Styling    | TailwindCSS, shadcn/ui, Radix UI primitives     |
| Routing    | wouter                                          |
| Data       | TanStack Query v5                               |
| Backend    | Express.js 5                                    |
| Database   | PostgreSQL with Drizzle ORM                     |
| Validation | Zod + drizzle-zod                               |

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **PostgreSQL** 14 or later

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/scinote.git
cd scinote

# Install dependencies
npm install

# Set up environment variables
export DATABASE_URL="postgresql://user:password@localhost:5432/scinote"
export SESSION_SECRET="your-session-secret"

# Push the database schema
npm run db:push

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5000`.

### Production Build

```bash
npm run build
npm start
```

---

## Project Structure

```
client/src/
  App.tsx                    Main app with theme provider, sidebar + editor layout
  pages/
    home.tsx                 Dashboard with calendar, project view, templates
    editor.tsx               Document editor with metadata bar, version history
  components/
    doc-sidebar.tsx          Collapsible sidebar with navigation sections
    block-editor.tsx         Core block editor with undo/redo, list continuation
    block-item.tsx           Individual block rendering with markdown shortcuts
    slash-command-menu.tsx   "/" command palette
    inline-toolbar.tsx       Floating formatting toolbar
    table-block.tsx          Editable table component
    search-modal.tsx         Full-text search (Ctrl+P)
    calendar-view.tsx        Monthly calendar grid
    project-view.tsx         Project cards with nested documents
    version-panel.tsx        Version history panel
    doc-metadata.tsx         Project selector, tag pills, dates
    workspace-manager.tsx    Workspace CRUD modal
    project-manager.tsx      Project CRUD modal
    tag-manager.tsx          Tag CRUD modal
    theme-provider.tsx       Dark/light mode context
  lib/
    export.ts                Markdown export with table/image support

server/
  index.ts                   Express server entry point
  routes.ts                  REST API routes
  storage.ts                 Database storage layer (all CRUD operations)
  db.ts                      Drizzle database connection
  seed.ts                    Sample scientific documents seeder

shared/
  schema.ts                  Drizzle schemas and Zod validation types
```

---

## API

### Documents

| Method | Endpoint                                    | Description                    |
| ------ | ------------------------------------------- | ------------------------------ |
| GET    | `/api/documents`                            | List all documents             |
| GET    | `/api/documents/search?q=query`             | Full-text search               |
| GET    | `/api/documents/:id`                        | Get a document                 |
| POST   | `/api/documents`                            | Create a document              |
| PATCH  | `/api/documents/:id`                        | Update a document              |
| DELETE | `/api/documents/:id`                        | Delete a document              |
| POST   | `/api/documents/:id/duplicate`              | Duplicate a document           |
| POST   | `/api/documents/:id/favorite`               | Toggle favorite                |
| GET    | `/api/documents/:id/tags`                   | Get document tags              |
| GET    | `/api/documents/:id/versions`               | List version history           |
| POST   | `/api/documents/:id/versions`               | Save a version snapshot        |
| POST   | `/api/documents/:id/versions/:ver/restore`  | Restore a version              |

### Workspaces, Projects & Tags

| Method | Endpoint               | Description            |
| ------ | ---------------------- | ---------------------- |
| GET    | `/api/workspaces`      | List workspaces        |
| POST   | `/api/workspaces`      | Create a workspace     |
| PATCH  | `/api/workspaces/:id`  | Update a workspace     |
| DELETE | `/api/workspaces/:id`  | Delete a workspace     |
| GET    | `/api/projects`        | List projects          |
| POST   | `/api/projects`        | Create a project       |
| PATCH  | `/api/projects/:id`    | Update a project       |
| DELETE | `/api/projects/:id`    | Delete a project       |
| GET    | `/api/tags`            | List tags              |
| POST   | `/api/tags`            | Create a tag           |
| DELETE | `/api/tags/:id`        | Delete a tag           |

---

## Database Schema

```
workspaces       id, name, color, description, createdAt
documents        id, title, blocks (jsonb), icon, coverColor, isFavorite,
                 projectId, workspaceId, version, updatedAt, createdAt, sortOrder
projects         id, name, color, description, workspaceId, createdAt
tags             id, name, color
document_tags    documentId, tagId (composite PK)
document_versions id, documentId, version, title, blocks (jsonb), createdAt
```

---

## Contributing

Contributions are welcome. Feel free to open issues for bugs or feature requests, or submit pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your branch and open a pull request

---

## License

This project is licensed under the [MIT License](LICENSE).
