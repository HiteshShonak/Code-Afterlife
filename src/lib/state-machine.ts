import type { ProjectState } from '@prisma/client';
import { HEALTH_CONFIG } from '@/config/health';
import { daysBetween } from '@/lib/utils';
import { ApiError } from '@/lib/api-error';

/** Valid next states for each lifecycle stage. */
const TRANSITIONS: Readonly<Record<ProjectState, readonly ProjectState[]>> = {
  BORN: ['ACTIVE'],
  ACTIVE: ['STALLED', 'SHIPPED'],
  STALLED: ['ACTIVE', 'DEAD'],
  SHIPPED: [],              // Terminal state
  DEAD: ['ACTIVE'],         // Resurrection path
};

/** Minimal project shape needed for state evaluation. */
export interface StateEvaluationInput {
  readonly state: ProjectState;
  readonly lastActivityAt: Date | null;
  readonly createdAt: Date;
}

export const stateMachine = {
  /**
   * Check if a state transition is valid.
   */
  canTransition(from: ProjectState, to: ProjectState): boolean {
    return TRANSITIONS[from].includes(to);
  },

  /**
   * Get all valid next states from the current state.
   */
  getValidTransitions(state: ProjectState): readonly ProjectState[] {
    return TRANSITIONS[state];
  },

  /**
   * Validate a transition — throws ApiError.badRequest() if invalid.
   * Call this before any state update.
   *
   * @throws {ApiError} 400 if transition is not allowed
   */
  validateTransition(from: ProjectState, to: ProjectState): void {
    if (!stateMachine.canTransition(from, to)) {
      const valid = TRANSITIONS[from].join(', ') || 'none';
      throw ApiError.badRequest(
        `Cannot transition from ${from} to ${to}. Valid transitions: ${valid}`
      );
    }
  },

  /**
   * Evaluate what state a project should be in based on activity age.
   * Called by the daily cron job and after webhook events.
   *
   * Rules:
   * - SHIPPED → stays SHIPPED (terminal)
   * - BORN with no activity → stays BORN
   * - 90+ days inactive → DEAD
   * - 30+ days inactive → STALLED
   * - Recent activity → ACTIVE
   */
  evaluateState(project: StateEvaluationInput): ProjectState {
    // SHIPPED is terminal — never changes
    if (project.state === 'SHIPPED') return 'SHIPPED';

    // BORN with no activity stays BORN
    if (project.state === 'BORN' && !project.lastActivityAt) return 'BORN';

    // Calculate days since last activity
    const referenceDate = project.lastActivityAt || project.createdAt;
    const daysSince = daysBetween(referenceDate, new Date());

    // 90+ days without activity = DEAD
    if (daysSince > HEALTH_CONFIG.deadDays) return 'DEAD';

    // 30+ days without activity = STALLED
    if (daysSince > HEALTH_CONFIG.stalledDays) return 'STALLED';

    // Recent activity = ACTIVE
    return 'ACTIVE';
  },
};
