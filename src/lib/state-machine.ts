import type { ProjectState } from '@prisma/client';
import { HEALTH_CONFIG } from '@/config/health';
import { daysBetween } from '@/lib/utils';
import { ApiError } from '@/lib/api-error';

// allowed states
const TRANSITIONS: Readonly<Record<ProjectState, readonly ProjectState[]>> = {
  BORN: ['ACTIVE', 'STALLED', 'DEAD'],
  ACTIVE: ['STALLED', 'SHIPPED'],
  STALLED: ['ACTIVE', 'DEAD'],
  SHIPPED: [],
  DEAD: ['ACTIVE'],
};

// project shape
export interface StateEvaluationInput {
  readonly state: ProjectState;
  readonly lastActivityAt: Date | null;
  readonly createdAt: Date;
}

export const stateMachine = {
  // check valid transition
  canTransition(from: ProjectState, to: ProjectState): boolean {
    return TRANSITIONS[from].includes(to);
  },

  // get next states
  getValidTransitions(state: ProjectState): readonly ProjectState[] {
    return TRANSITIONS[state];
  },

  // validate or throw
  validateTransition(from: ProjectState, to: ProjectState): void {
    if (!stateMachine.canTransition(from, to)) {
      const valid = TRANSITIONS[from].join(', ') || 'none';
      throw ApiError.badRequest(
        `Cannot transition from ${from} to ${to}. Valid transitions: ${valid}`
      );
    }
  },

  // eval project state
  evaluateState(project: StateEvaluationInput): ProjectState {
    // shipped is terminal
    if (project.state === 'SHIPPED') return 'SHIPPED';

    // born stays born
    if (project.state === 'BORN' && !project.lastActivityAt) return 'BORN';

    // get days since last activity
    const referenceDate = project.lastActivityAt || project.createdAt;
    const daysSince = daysBetween(referenceDate, new Date());

    // dead check
    if (daysSince > HEALTH_CONFIG.deadDays) return 'DEAD';

    // stalled check
    if (daysSince > HEALTH_CONFIG.stalledDays) return 'STALLED';

    // active check
    return 'ACTIVE';
  },
};
