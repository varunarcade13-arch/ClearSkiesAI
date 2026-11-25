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

- 41 test files; 204 tests pass, with no skipped or disabled tests. Nine tests were added in this continuation.
- This continuation covers chat AQI/weather fallbacks, recommendation fallbacks, location modal keyboard/search states, model AQI and inversion states, rate limiter sweep timing, and AQI notification behavior for empty/non-critical alerts.
- `npx tsc --noEmit`: passes after the production build completed. An earlier parallel invocation raced with `.next/types` generation and was rerun successfully.
- `npm run lint`: passes with no warnings or errors. Next reports that `next lint` is deprecated.
- `npm run build`: passes and generates the production app.
- `npx vitest run --coverage`: all tests pass; the command exits nonzero because the configured 100% thresholds are not achieved.

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
