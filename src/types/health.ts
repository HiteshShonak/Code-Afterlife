/** Decay lifecycle stages from thriving to dead. Maps to visual styling. */
export type DecayState = 'thriving' | 'stable' | 'unstable' | 'nearDeath' | 'dead';

/** Result of a health score calculation with decay classification. */
export interface HealthResult {
  /** Health score (0-100, one decimal place). */
  readonly score: number;
  /** Decay state derived from the health score. */
  readonly decayState: DecayState;
  /** Human-readable label (e.g. "Thriving", "Near Death"). */
  readonly label: string;
}

/** Input data needed to calculate project health. */
export interface HealthCalculationInput {
  /** Last recorded activity date, or null if no activity. */
  readonly lastActivityAt: Date | null;
  /** Project creation date (fallback for activity calculations). */
  readonly createdAt: Date;
  /** Number of timeline entries in the last 30 days. */
  readonly commitsThisMonth: number;
  /** Number of timeline entries in days 30-60 ago. */
  readonly commitsLastMonth: number;
}

/** Health bucket with visual metadata for frontend rendering. */
export interface HealthBucket {
  /** Current decay state. */
  readonly state: DecayState;
  /** Human-readable label (e.g. "Thriving", "Near Death"). */
  readonly label: string;
  /** CSS variable reference for health state color. */
  readonly color: string;
}
