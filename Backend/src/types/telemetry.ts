/**
 * AgriFlux Telemetry Quality & Freshness Safety Specification
 * ------------------------------------------------------------
 * Centralized telemetry freshness thresholds, quality evaluation,
 * and fail-safe bounds checking for precision agricultural decision making.
 */

export const TELEMETRY_FRESHNESS_WINDOW_MINUTES = 15;
export const TELEMETRY_FRESHNESS_WINDOW_MS = TELEMETRY_FRESHNESS_WINDOW_MINUTES * 60 * 1000;
export const MAX_CLOCK_SKEW_FUTURE_TOLERANCE_MS = 60 * 1000; // 60s future tolerance for network clock drift

export type TelemetryQualityStatus = 'fresh' | 'stale' | 'missing' | 'invalid' | 'simulated';

export interface TelemetryQualityAssessment {
  quality: TelemetryQualityStatus;
  isFresh: boolean;
  isStale: boolean;
  freshnessMinutes: number;
  reason?: string;
}

/**
 * Deterministically evaluates telemetry quality state across 5 strict categories:
 * - fresh: valid physical measurement within the 15-minute validity window
 * - stale: valid physical measurement older than the 15-minute validity window
 * - missing: null/undefined or omitted telemetry reading
 * - invalid: NaN, infinite, out-of-range (<0 or >100%), missing or malformed timestamp, or future-dated
 * - simulated: explicitly flagged simulation profile (never treated as verified physical measurement)
 */
export function evaluateTelemetryQuality(
  reading:
    | {
        moisture?: number | null;
        timestamp?: string | Date;
        rawTimestamp?: Date;
        createdAt?: Date;
        isSimulated?: boolean;
      }
    | null
    | undefined
): TelemetryQualityAssessment {
  // 1. Missing Telemetry
  if (!reading || reading.moisture === undefined || reading.moisture === null) {
    return {
      quality: 'missing',
      isFresh: false,
      isStale: true,
      freshnessMinutes: -1,
      reason: 'No soil moisture telemetry reading is available.',
    };
  }

  // 2. Physical & Numerical Bounds Validation
  const rawM = Number(reading.moisture);
  if (isNaN(rawM) || !isFinite(rawM) || rawM < 0 || rawM > 100) {
    return {
      quality: 'invalid',
      isFresh: false,
      isStale: true,
      freshnessMinutes: -1,
      reason: `Soil moisture value (${reading.moisture}) is non-finite or outside physical percentage bounds [0, 100].`,
    };
  }

  // 3. Timestamp Verification
  const tsRaw = reading.createdAt || reading.rawTimestamp || reading.timestamp;
  if (!tsRaw) {
    return {
      quality: 'invalid',
      isFresh: false,
      isStale: true,
      freshnessMinutes: -1,
      reason: 'Telemetry record is missing an acquisition timestamp.',
    };
  }

  const readingTime = new Date(tsRaw).getTime();
  if (isNaN(readingTime)) {
    return {
      quality: 'invalid',
      isFresh: false,
      isStale: true,
      freshnessMinutes: -1,
      reason: `Telemetry acquisition timestamp "${tsRaw}" is malformed or unparseable.`,
    };
  }

  const now = Date.now();

  // 4. Future-dated timestamp rejection (beyond clock skew tolerance)
  if (readingTime > now + MAX_CLOCK_SKEW_FUTURE_TOLERANCE_MS) {
    return {
      quality: 'invalid',
      isFresh: false,
      isStale: true,
      freshnessMinutes: -1,
      reason: `Telemetry timestamp is future-dated (${new Date(readingTime).toISOString()}), exceeding maximum clock skew tolerance of 60 seconds.`,
    };
  }

  const ageMs = Math.max(0, now - readingTime);
  const freshnessMinutes = Math.round(ageMs / 60000);

  // 5. Explicit Simulation Handling
  if (reading.isSimulated) {
    const isStaleSim = freshnessMinutes > TELEMETRY_FRESHNESS_WINDOW_MINUTES;
    return {
      quality: 'simulated',
      isFresh: !isStaleSim,
      isStale: isStaleSim,
      freshnessMinutes,
      reason: isStaleSim
        ? `Simulated telemetry profile age (${freshnessMinutes}m) exceeds freshness window.`
        : 'Telemetry generated from calibrated IoT simulation profile.',
    };
  }

  // 6. Freshness Boundary Evaluation
  if (freshnessMinutes > TELEMETRY_FRESHNESS_WINDOW_MINUTES) {
    return {
      quality: 'stale',
      isFresh: false,
      isStale: true,
      freshnessMinutes,
      reason: `Physical telemetry age (${freshnessMinutes}m) exceeds configured ${TELEMETRY_FRESHNESS_WINDOW_MINUTES}-minute freshness boundary.`,
    };
  }

  return {
    quality: 'fresh',
    isFresh: true,
    isStale: false,
    freshnessMinutes,
  };
}
