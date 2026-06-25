export const HEALTH_CONFIG = {
  weights: {
    activity: 0.4,
    consistency: 0.3,
    momentum: 0.3,
  },
  thresholds: {
    thriving: 80,
    stable: 60,
    unstable: 40,
    nearDeath: 20,
  },
  activity: {
    windowDays: 45,
    maxCommits: 30,
  },
  stalledDays: 7,
  deadDays: 30,
  deadHealthDecayDays: 2,
  initialHealth: 50,
} as const;
