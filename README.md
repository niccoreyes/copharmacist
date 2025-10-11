# CoPharmacist
```
# CoPharmacist

This repository contains the frontend for the CoPharmacist project built with Vite, React, TypeScript, Tailwind CSS, and shadcn-ui.

## Project overview
- Tech stack: Vite, React, TypeScript, Tailwind CSS, shadcn-ui
- Core UI components live under `src/components` and UI primitives under `src/components/ui`.
- Self-contained frontend ready for local development and deployment.

## Quick start

Prerequisites:
- Bun is recommended for fast installs and dev server. Install from https://bun.sh/
- You can also use npm/yarn if Bun is not available.

Setup and run (Windows PowerShell or any shell):
```
bun install
bun run dev
```

The dev server provides hot-reload and serves the app locally.

## Local development guide
- Open the repository in your editor (e.g., VS Code).
- Install dependencies with `bun install`.
- Start the dev server with `bun run dev`.
- Access the app at the URL printed in the terminal (default http://localhost:5173).

If Bun is unavailable, you can fall back to npm/yarn equivalents, but Bun is the preferred workflow for this repo.

## Project structure (highlights)
- `src/` – application source code
- `src/components/` – reusable UI components (e.g., `InlineMedicationEntry.tsx`, `MedicationForm.tsx`, etc.)
- `src/components/ui/` – UI primitives (buttons, dialogs, inputs, etc.)
- `public/` – static assets
- `vite.config.ts` – Vite configuration
- `package.json` – project metadata and scripts

## Technologies used
- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn-ui

## Deployment notes
- This project is frontend-only. To deploy, build production assets and host with a static site provider (e.g., Vercel, Netlify).

## Repository information
- Owner: niccoreyes
- Branch: main
- Path: c:\GitHub\copharmacist
```
- Vite
