# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Student voting system PWA built with React and Vite, using PouchDB for local-first data storage. The application provides role-based interfaces for administrators, tutors, and students to manage and participate in school elections.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (local only)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests (when implemented)
npm test
```

## Architecture

### Database Architecture
- **PouchDB**: Local browser database for offline functionality
- **Local-first**: App works completely offline with local data storage
- Connection status displayed via `ConnectionStatus` component
- Database service located in `src/services/database.js`

### Application Structure
- **Multi-role system**: Admin, Tutor, Student interfaces
- **Context-based auth**: `AuthContext` manages authentication state
- **Protected routes**: `ProtectedRoute` and `TutorRoute` components
- **Progressive enhancement**: Currently only tutor interface is implemented

### Component Organization
```
src/components/
├── admin/           # Administrator interface (planned)
├── auth/            # Authentication components
├── common/          # Shared components (ConnectionStatus)
├── tutor/           # Tutor interface (active)
└── voting/          # Voting interface (planned)
```

### Key Services
- `src/services/database.js`: PouchDB interface with CRUD operations
- `src/services/auth.js`: Authentication logic
- `src/hooks/useDatabase.jsx`: Database React hook
- `src/hooks/useAuth.jsx`: Authentication React hook

## Environment Configuration

### Local Development
- App runs on `localhost:3000`
- Hot reloading enabled for fast development

### Database Connection
- Local DB: `votaciones_estudiantiles` 
- Automatic index creation for `type` and `type+code` fields
- Data persisted in browser's IndexedDB

## Development Notes

### Current Implementation Status
- ✅ Tutor interface and authentication
- 🚧 Admin interface (placeholder alerts)
- 🚧 Student interface (placeholder alerts)
- ✅ Database service and offline support
- ✅ Local development setup and PWA configuration

### Testing Structure
Test directories exist but are not yet implemented:
- `tests/unit/`
- `tests/integration/`
- `tests/e2e/`

### Scripts and Setup
Multiple setup scripts are available in `scripts/` directory for different configuration scenarios. The `docs/README-SETUP.md` provides detailed setup instructions.