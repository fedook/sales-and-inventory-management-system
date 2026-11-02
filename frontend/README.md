# Frontend — Sales & Inventory System

React + TypeScript + Vite client for the Sales and Inventory Management System.

See the [project README](../README.md) for full setup instructions, API documentation,
and the phase roadmap.

## Quick start

```powershell
npm install
npm run dev
```

The app runs at <http://localhost:5173> and calls the API at
`http://localhost:7000/api` by default.

To use a different API URL:

```powershell
Copy-Item .env.example .env
```

Then edit `VITE_API_URL` in `.env`.

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run oxlint |

## Structure

```
src/
├── components/   reusable UI pieces
├── hooks/        reusable stateful logic (useApiHealth)
├── layouts/      shared page shells
├── pages/        route-level screens
├── services/     Axios instance and API calls
├── types/        shared TypeScript types
├── utils/        small helpers
├── assets/       images and static assets
├── App.tsx       routes
└── main.tsx      React entry point
```
