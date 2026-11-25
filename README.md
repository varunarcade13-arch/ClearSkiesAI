# ClearSkies AI

ClearSkies AI is a responsive air quality and winter smog assistant built with Next.js App Router, React, TypeScript, and Tailwind CSS. It combines live location search, air quality observations/model estimates, weather context, exposure guidance, family plans, indoor air tips, sustainable alternatives, community campaigns, and an optional Gemini assistant.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Open-Meteo geocoding, air quality, and weather endpoints do not require keys. To enable live Gemini answers, set `GEMINI_API_KEY`. To use WAQI station observations, set `WAQI_API_TOKEN` and `AQI_PROVIDER=waqi`. Without a Gemini key, the app clearly reports that AI is unconfigured; deterministic safety guidance remains available.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Server-side Google GenAI API key for personalized chat and plans. |
| `GEMINI_MODEL` | No | Gemini model ID; defaults to `gemini-3.5-flash-lite`. |
| `WAQI_API_TOKEN` | No | Token for WAQI station observations. |
| `AQI_PROVIDER` | No | `open-meteo` (default) for model estimates or `waqi` for station readings. |
| `WEATHER_API_KEY` | No | Reserved for a future weather provider; Open-Meteo currently needs no key. |

Never prefix secrets with `NEXT_PUBLIC_`. Configure production secrets in Vercel Project Settings rather than committing them.

## Architecture

`src/domain` holds AQI categories, recommendation logic, alert evaluation, family types, indoor guidance, and sustainability estimates. `src/application` contains use cases and dependency wiring. `src/infrastructure` provides Open-Meteo, WAQI, Gemini, reverse geocoding, caching, and request security adapters. `src/app/api` exposes server-side route handlers. `src/presentation` contains accessible views, reusable components, theme, and browser-side state.

AQI responses retain provider/source and distinguish Open-Meteo modelled estimates from WAQI station measurements. Indian NAQI calculations and pollutant thresholds are labeled where applicable. CPCB is documented as the official source; this project does not claim a direct CPCB live feed because no dependable public integration is configured. Missing API data is presented as unavailable rather than filled with fabricated live values. Community campaigns and their progress are sample content, not measured local participation.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm test
npm run test:coverage
npm run build
```

Vitest uses mocked provider contracts for deterministic unit and integration tests. The current suite does not include full browser-driven end-to-end tests or automated axe scans; keyboard and assistive-technology verification still needs to be performed before claiming WCAG 2.2 AA conformance. Coverage output is generated in `coverage/` and should be reported from the actual run.

## Vercel deployment

Import this directory as a Next.js project in Vercel, set the optional environment variables above, then deploy. Route handlers use serverless-compatible request/response APIs; the app does not require persistent local storage. Confirm the production build and live provider configuration after deployment. This repository copy has not been deployed.

## Security notes

Gemini calls run server-side. API routes validate inputs, constrain prompt context, validate structured results, apply request-size/rate controls, and return safe errors. When the user explicitly chooses GPS detection, coordinates are sent server-side to OpenStreetMap Nominatim to resolve a place name; reverse lookup results are cached and attribution is displayed in the app. The selected location is stored in browser local storage. Review CSP and deployment headers in `next.config.mjs` when adding third-party scripts or changing hosting configuration.
