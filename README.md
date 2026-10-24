# CK Text Game

A browser based, text driven medieval dynasty and social mobility simulation built with Next.js, React, and TypeScript. The game combines a local rules engine with optional Gemini generated narration.

## Run locally

- Node.js 22 or newer
- npm

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>.

## Useful commands

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # Node test runner through tsx
npm run build      # Production build
```

The older top level `test_*.ts` and `test_*.mjs` files are historical scenario scripts. The maintained automated suite lives under `tests/` and runs in CI.

## System map

- `src/lib/engine/simulationCore.ts`: deterministic action resolution and initial game state.
- `src/lib/engine/timeEngine.ts`: calendar date, day/month/year progression, and speed controls. Player actions do not advance calendar time.
- `src/lib/engine/events/`: historical, court, church, realm, and epidemic events.
- `src/lib/engine/militaryEngine.ts`, `src/lib/engine/mapData.ts`: army movement, battles, sieges, and map data.
- `src/lib/estate.ts`, `src/lib/estateEconomy.ts`, `src/lib/populationEconomy.ts`: estate, construction, population, and economy rules.
- `src/lib/characterRelations.ts`, `src/lib/factionRelations.ts`: character agendas and faction hostility.
- `src/lib/geneticEngine.ts`, `src/lib/engine/genesisEngine.ts`, `src/lib/statusPromotion.ts`: inheritance, character generation, and social advancement.
- `src/lib/saveManager.ts`: local save slots, autosaves, undo state, and settings.
- `src/app/api/`: optional Gemini game, chronicler, recommendation, and validation endpoints.

## Gemini key handling

The app uses bring your own key (BYOK). Enter a Gemini API key in the in game settings. It is held in the current browser tab's `sessionStorage`, sent in the request body to this app's API route, and then used by the Google GenAI SDK. The app does not persist a shared server key or accept `GEMINI_API_KEY` as a fallback. The key is still available to scripts running on this origin, so only use a key with appropriate Google-side restrictions and quotas. Closing the tab ends the session; older persistent copies are migrated and removed when the key helper is next used.

The API routes reject non-JSON bodies, cap body sizes, and validate the shape and length of key request fields. They do not provide user authentication or durable distributed rate limiting. Public deployments should add platform level rate limits and abuse monitoring before enabling Gemini endpoints broadly.

## Gameplay direction

The full system inventory, core loop proposal, CK3 reference principles, milestones, and acceptance criteria are in [docs/GAME_SYSTEMS_PLAN.md](docs/GAME_SYSTEMS_PLAN.md).
