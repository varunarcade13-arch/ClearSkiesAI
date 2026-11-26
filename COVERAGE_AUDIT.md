# ClearSkies AI Unit Coverage Report

Generated: 2026-11-20

## Result

The requested 100% coverage objective is **not yet met**. Vitest still enforces 100% thresholds for all four metrics and correctly exits nonzero when the current report falls short.

| Metric | Initial expanded baseline | Current | Target |
|---|---:|---:|---:|
| Statements | 41.31% (568/1,376) | 99.92% (1,375/1,376) | 100% |
| Branches | 38.88% (451/1,159) | 98.96% (1,147/1,159) | 100% |
| Functions | 31.75% (87/274) | 100% (274/274) | 100% |
| Lines | 41.11% (518/1,260) | 99.92% (1,259/1,260) | 100% |

The initial expanded baseline includes all executable `src` files. The earlier pre-expansion report covered only selected layers and is not comparable.

At the start of this continuation, the report was Statements 97.89%, Branches 89.90%, Functions 95.25%, and Lines 98.65% (167 tests).

## Tests and verification

- 43 test files; 252 tests pass, with no skipped or disabled tests. 48 tests were added in the AI Assistant Intelligent Query Understanding and Location Resolution release.
- Added test suites for query intent detection, explicit and multi-location extraction, follow-up resolution, geocoding alias/PIN-code resolution, multi-location comparison chat responses, and chat UI comparison cards rendering.
- `npx tsc --noEmit`: passes cleanly with zero errors.
- `npm run lint`: passes with no warnings or errors.
- `npm run build`: passes and generates the production app.
- `npm test`: all 43 test files and 252 unit/integration tests pass.

## Continuation changes: AI Assistant Location-Aware & Intelligent Query Enhancement

The ClearSkies AI assistant was enhanced with an intelligent query understanding domain service, dynamic location resolution, real-time AQI retrieval, and multi-location comparison capabilities:
- **Query Analyzer (`src/domain/ai/query-analyzer.ts`)**: Detects 7 question categories (`AQI_QUERY`, `HEALTH_PROTECTION`, `INDOOR_AIR`, `WEATHER_OUTDOOR`, `SUSTAINABLE_LIVING`, `COMMUNITY_AWARENESS`, `GENERAL`), extracts explicit locations (cities, international locations, PIN codes, sectors like "Sector 17 Chandigarh"), parses comparisons ("Mohali vs Delhi"), and handles conversational follow-ups.
- **Orchestration Pipeline (`src/application/chat/ExecuteGeminiChatUseCase.ts`)**: Resolves locations via geocoding, retrieves live AQI from CPCB/Open-Meteo/WAQI for requested cities, and builds structured comparison contexts.
- **GenAI Prompt & Demo (`src/infrastructure/ai/GoogleGenAIProvider.ts`)**: Formats resolved location metrics or structured comparisons into system instructions, explicitly preventing GPS fallback for named cities.
- **CPCB Presets & Geocoding**: Added Mohali and Chandigarh ground-truth stations, PIN code resolution, and locality fallback search.
- **Chat Presentation (`src/presentation/components/chat/AIAssistantView.tsx`)**: Renders location comparison summary cards for side-by-side AQI metrics.

## Remaining coverage gaps

All executable functions are covered. The current V8 report identifies one missed statement/line and 12 missed branch outcomes:

- `src/domain/aqi/calculator.ts:125`: defensive `return null` after invalid values and unknown pollutants are rejected, values above the final breakpoint are capped, and both interpolation ranges and configured breakpoint gaps are checked. Valid concentrations in the configured pollutant tables have no remaining route to this return.
- `src/domain/sustainability/calculator.ts:86`: `options[0]` fallback when no metro option exists. This function builds its options internally and always includes `metro_train`.
- `src/infrastructure/aqi/OpenMeteoAirQualityProvider.ts:130,138,220-221,224`: nullish fallbacks after `calculateSubIndex`. Provider values are finite, nonnegative measurements and pollutant names/standards are fixed to supported breakpoint tables, for which the calculator returns a numeric index. Tests cover absent/invalid measurements and hourly PM2.5/PM10 alternatives.
- `src/infrastructure/aqi/WaqiAirQualityProvider.ts:72,121,128`: station-name and sub-index fallbacks. The mapper always creates a station with a name and only adds particulate measurements after validation against supported pollutants.
- `src/infrastructure/security/RateLimiter.ts:15`: the report marks one outcome uncovered even though a test explicitly calls before and after the sweep interval; this remains a coverage-provider result to investigate.

Current counts are 1,375/1,376 statements, 1,147/1,159 branches, 274/274 functions, and 1,259/1,260 lines. No thresholds or production coverage exclusions were changed. The remaining null-return branches cannot be forced by valid provider inputs without invalid instrumentation or changing defensive production behavior solely for coverage, so this report does not claim the 100% acceptance target is met.

## Coverage scope and exclusions

Coverage includes executable TypeScript and TSX under `src`. Exclusions are tests, test setup, declaration files, generated/dependency output, and six type-only contracts that compile to no JavaScript: `src/domain/aqi/types.ts`, `src/domain/recommendation/types.ts`, `src/infrastructure/ai/IGenAIProvider.ts`, `src/infrastructure/aqi/IAQIService.ts`, `src/infrastructure/location/ILocationService.ts`, and `src/infrastructure/weather/IWeatherService.ts`. No production source module was excluded to improve the score.

## Production behavior changes

The existing Open-Meteo forecast mapping was corrected so an hourly point is omitted when both PM2.5 and PM10 are missing, and a point with one available particulate measurement is calculated from that measurement rather than a fabricated zero. `HourlyAQIPoint.pm25` is optional to reflect provider data. Regression tests cover those cases.

## Continuation changes

No production source files were modified in this continuation. Test files updated: `src/presentation/components/dashboard/LiveAQIView.test.tsx`, `src/presentation/components/common/Header.test.tsx`, `src/presentation/components/common/LocationSearchModal.test.tsx`, `src/infrastructure/security/RateLimiter.test.ts`, `src/presentation/components/chat/AIAssistantView.test.tsx`, `src/presentation/components/recommendations/RecommendationsView.test.tsx`, `src/presentation/context/AQIContext.test.tsx`, `src/infrastructure/aqi/OpenMeteoAirQualityProvider.test.ts`, and `src/presentation/components/dashboard/OverviewView.test.tsx` (test typing only).

The remaining gaps are documented above. The strict 100% threshold remains configured for all metrics, and the current run must not be described as 100% coverage.
