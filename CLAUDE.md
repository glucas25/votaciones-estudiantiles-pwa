# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Student voting system PWA built with React and Vite, using PouchDB/CouchDB for offline-first data synchronization. The application provides role-based interfaces for administrators, tutors, and students to manage and participate in school elections.

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

# Start with Docker (full stack with CouchDB)
docker-compose up -d

# View Docker logs
docker-compose logs -f

# Stop Docker services
docker-compose down
```

## Architecture

### Database Architecture
- **PouchDB**: Local browser database for offline functionality
- **CouchDB**: Remote database for synchronization (runs on port 5984)
- **Offline-first**: App works without internet, syncs when available
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
- `src/services/database.js`: PouchDB/CouchDB interface with CRUD operations
- `src/services/auth.js`: Authentication logic
- `src/hooks/useDatabase.jsx`: Database React hook
- `src/hooks/useAuth.jsx`: Authentication React hook

## Environment Configuration

### Docker Environment
- CouchDB runs on `localhost:5984`
- Default credentials: `admin:votaciones2024`
- App runs on `localhost:3000`
- Volume mounts for hot reloading during development

### Database Connection
- Local DB: `votaciones_estudiantiles` 
- Remote DB: `http://admin:votaciones2024@localhost:5984/votaciones_estudiantiles`
- Automatic index creation for `type` and `type+code` fields

## Development Notes

### Current Implementation Status
- ✅ Tutor interface and authentication
- 🚧 Admin interface (placeholder alerts)
- 🚧 Student interface (placeholder alerts)
- ✅ Database service and offline support
- ✅ Docker configuration and PWA setup

### Testing Structure
Test directories exist but are not yet implemented:
- `tests/unit/`
- `tests/integration/`
- `tests/e2e/`

### Scripts and Setup
Multiple setup scripts are available in `scripts/` directory for different configuration scenarios. The `docs/README-SETUP.md` provides detailed setup instructions.