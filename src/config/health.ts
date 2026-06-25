// config for health scores
export const HEALTH_CONFIG = {
  // health weights
  weights: {
    // activity weight
    activity: 0.4,
    // consistency weight
    consistency: 0.3,
    // momentum weight
    momentum: 0.3,
  },
  // state thresholds
  thresholds: {
    thriving: 80,
    stable: 60,
    unstable: 40,
    nearDeath: 20,
  },
  // activity metrics params
  activity: {
    // days to observe
    windowDays: 30,
    // max commits
    maxCommits: 20,
  },
  // days before stalled
  stalledDays: 1,
  // days before dead
  deadDays: 3,
  // dead projects lose 1 health point every N days after crossing the dead threshold
  deadHealthDecayDays: 2,
  // starting health
  initialHealth: 50,
} as const;
