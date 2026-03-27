# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Real-time**: Socket.io (WebSockets)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server + Socket.io
│   └── blockbusters/       # Blockbusters Game Show React app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/blockbusters` (`@workspace/blockbusters`)

Blockbusters Game Show app. Three synchronized user views:
- **Home** (`/`) — Role selector (Host, Moderator, Audience, Admin)
- **Host** (`/host`) — Interactive game control with hex board
- **Moderator** (`/moderator`) — Override/admin control with question preview
- **Audience** (`/audience`) — Read-only display with victory banner
- **Admin** (`/admin`) — Question management, tournaments, match setup

Frontend packages: framer-motion, socket.io-client, lucide-react, canvas-confetti

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with Socket.io for real-time sync.

- Entry: `src/index.ts` — HTTP server + Socket.io init
- App setup: `src/app.ts` — CORS, JSON, routes at `/api`
- Routes: questions, matches, tournaments, sheets (Google Sheets sync)
- `src/lib/pathfinding.ts` — BFS pathfinding for winning path detection
- `src/lib/socketManager.ts` — Socket.io event handling (buzz, openBlock, awardBlock, etc.)
- Depends on: `@workspace/db`, `@workspace/api-zod`

### `lib/db` (`@workspace/db`)

Database schema:
- `questionsTable` — Question bank (questionId, text, difficulty, category, answer)
- `tournamentsTable` — Tournaments (Ramadan 2026 Men's/Ladies/Youth)
- `matchesTable` — Matches (matchNumber, redTeamName, blueTeamName, boardSize 3x3/5x5, status)
- `gameStatesTable` — Live game state (blocks JSON, buzzerStatus, currentBlockIndex)

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI spec with endpoints for questions, matches, tournaments, game state, Google Sheets sync.

Codegen: `pnpm --filter @workspace/api-spec run codegen`

## Google Sheets Integration

The `/api/sheets/sync` endpoint syncs questions from Google Sheets.
Requires the Google Sheets connector to be set up via Replit integrations.
Sheet format: columns for Question ID, Question Text, Difficulty Badge, Category, Answer.

## Socket.io Events

### Server → Client
- `gameState` — Full game state payload
- `buzzer` — `{ team }` when a team buzzes in
- `blockOpened` — `{ blockIndex, question }` when host opens a block
- `blockAwarded` — `{ blockIndex, team }` when block is awarded
- `matchComplete` — `{ winner, teamName }` when game ends

### Client → Server
- `joinMatch` — Join a match room
- `openBlock` — `{ matchId, blockIndex }` — host opens a hex
- `buzz` — `{ matchId, team }` — team buzzes in
- `resetBuzzer` — `{ matchId }` — clear buzzer state
- `awardBlock` — `{ matchId, blockIndex, team, questionId }` — award hex to team
- `swapQuestion` — `{ matchId }` — moderator swaps question back to pool
- `discardQuestion` — `{ matchId }` — moderator permanently removes question

## Pathfinding

BFS on hex grid:
- **Red wins**: Left→Right path (any row spanning column 0 to column N-1)
- **Blue wins**: Top→Bottom path (any column spanning row 0 to row N-1)
- Neighbors: 8-directional (up, down, left, right + diagonals)
- Match Point detection: check if awarding a block to a team would complete their path
