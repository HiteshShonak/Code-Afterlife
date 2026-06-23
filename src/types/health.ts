// decay states
export type DecayState = 'thriving' | 'stable' | 'unstable' | 'nearDeath' | 'dead';

// health result
export interface HealthResult {
  // score 0-100
  readonly score: number;
  // state bucket
  readonly decayState: DecayState;
  // display label
  readonly label: string;
}

// health input
export interface HealthCalculationInput {
  // project state
  readonly state: import('@prisma/client').ProjectState;
  // last activity
  readonly lastActivityAt: Date | null;
  // creation date
  readonly createdAt: Date;
  // commits this month
  readonly commitsThisMonth: number;
  // commits last month
  readonly commitsLastMonth: number;
}

// health bucket ui
export interface HealthBucket {
  // state
  readonly state: DecayState;
  // label
  readonly label: string;
  // color css var
  readonly color: string;
}
