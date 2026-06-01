# EnergoPole Project Guide for AI Agents

This document provides an overview of the "EnergoPole" project to help other AI agents quickly understand the architecture, tech stack, and structure.

## Overview
EnergoPole is a web application designed to manage field projects, tasks, and geographic or schema-based data (likely related to energy/utility poles or similar infrastructure). 

The application has offline capabilities (PWA, IndexedDB via Dexie) and rich interactive features like drawing schemas (Fabric.js) and maps (Leaflet).

## Tech Stack
### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Local Database**: Dexie (wrapper for IndexedDB)
- **Maps**: Leaflet & React-Leaflet (`src/components/InteractiveMap`, `src/components/PhotoGeoModal`)
- **Canvas/Drawing**: Fabric.js (`src/components/SchemaCanvas`, `src/components/CanvasToolbar`)
- **PWA**: vite-plugin-pwa (for offline support)
- **Linting/Formatting**: ESLint, Prettier

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB
- **Key Modules**:
  - `auth` (JWT and role-based access control: Engineer/Manager)
  - `objects` & `equipment` (handling electric power objects and electrical equipment)
  - `issues` (managing tasks and reported problems)
  - `photos` & `schemas` (processing canvas blueprints, uploads, and image assets)
  - `sync` (synchronization logic for offline-first frontend clients)
- **Demo Users** (automatically seeded on startup):
  - **Engineer**: `user@example.com` / `password`
  - **Manager**: `manager@example.com` / `manager`

## Project Structure
- `/src/` - Frontend source code.
  - `/src/components/` - Reusable UI components (e.g., `ProjectForm`, `SchemaCanvas`, `InteractiveMap`, `OnlineStatus`).
  - `/src/pages/` - Top-level route components (`LoginPage`, `ManagerPage`, `ProjectListPage`, `SchemaEditor`).
  - `/src/db/` - Contains Dexie database schemas and setup for local data persistence.
  - `/src/services/` - API integration and business logic.
- `/backend/` - Backend source code.
  - `/backend/app/` - Python backend application logic (routers, CRUD operations, database models).
  - `/backend/app/routers/` - FastAPI routers representing api endpoints (`/api/auth`, `/api/objects`, `/api/equipment`, `/api/issues`, `/api/photos`, `/api/schemas`, `/api/sync`).
- `package.json` & `vite.config.ts` - Frontend build configuration.

## Key Features & Components
1. **Schema Editor**: Uses `fabric.js` to draw and edit schemas (`useSchemaCanvas.ts`, `SchemaCanvas`, `SchemaEditor`).
2. **Interactive Maps**: Uses `leaflet` to display and manage geodata (`InteractiveMap`, `TaskGeoView`, `PhotoGeoModal`).
3. **Project & Task Management**: Components like `ProjectList`, `ProjectForm`, `TaskForm`, `ProjectTasksList`.
4. **Offline Support & Synchronization**: The presence of `OnlineStatus.tsx` and `dexie` indicates the app is designed to work offline, saving data locally and syncing it with the FastAPI `/api/sync` endpoints later.

## General Instructions for Agents
- When modifying the frontend, adhere to React hooks best practices and use TypeScript.
- Be aware that `fabric.js` and `leaflet` interact directly with the DOM; handle component lifecycles carefully (e.g. cleanup on unmount) within React.
- Ensure that changes to the frontend state are reflected properly in Dexie if they need to persist offline.
- To read `backend/requirements.txt`, be mindful that it might be encoded in UTF-16LE.
- When working on the backend, check out `/backend/app/routers` and MongoDB models/CRUDs.

