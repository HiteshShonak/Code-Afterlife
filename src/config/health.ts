/**
 * Configuration options for the project health scoring system and decay thresholds.
 */
export const HEALTH_CONFIG = {
  /** Weights used to compute the overall health score from component metrics. */
  weights: {
    /** 40% weight: active commits this month. */
    activity: 0.4,
    /** 30% weight: consistency based on days since last activity. */
    consistency: 0.3,
    /** 30% weight: momentum comparing current month vs previous month. */
    momentum: 0.3,
  },
  /** Minimum health scores required to belong to each decay state bucket. */
  thresholds: {
    thriving: 80,
    stable: 60,
    unstable: 40,
    nearDeath: 20,
  },
  /** Parameters for calculating the monthly activity metrics. */
  activity: {
    /** The observation window in days (30 days). */
    windowDays: 30,
    /** Max commit limit used to normalize activity (100% activity). */
    maxCommits: 100,
  },
  /** Number of inactive days before transition to the STALLED lifecycle state. */
  stalledDays: 1,
  /** Number of inactive days before transition to the DEAD lifecycle state. */
  deadDays: 3,
  /** Starting health value assigned to newly created projects. */
  initialHealth: 50,
} as const;

