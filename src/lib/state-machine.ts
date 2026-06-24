import type { ProjectState } from '@prisma/client';
import { HEALTH_CONFIG } from '@/config/health';
import { daysBetween } from '@/lib/utils';
import { ApiError } from '@/lib/api-error';

// allowed states
const TRANSITIONS: Readonly<Record<ProjectState, readonly ProjectState[]>> = {
  BORN: ['ACTIVE', 'STALLED', 'DEAD'],
  ACTIVE: ['STALLED', 'SHIPPED', 'DEAD'],
  STALLED: ['ACTIVE', 'DEAD'],
  SHIPPED: [],
  DEAD: ['ACTIVE'],
};

export type TransitionSource = 'manual' | 'health_cron' | 'ai_pulse' | 'resurrection';

export interface TransitionContext {
  readonly source: TransitionSource;
}

type TransitionKey = `${ProjectState}:${ProjectState}`;

const SOURCE_TRANSITIONS: Readonly<Partial<Record<TransitionKey, readonly TransitionSource[]>>> = {
  'BORN:ACTIVE': ['manual', 'ai_pulse'],
  'BORN:STALLED': ['health_cron'],
  'BORN:DEAD': ['manual', 'health_cron'],
  'ACTIVE:STALLED': ['health_cron'],
  'ACTIVE:SHIPPED': ['manual'],
  'ACTIVE:DEAD': ['manual', 'health_cron'],
  'STALLED:ACTIVE': ['ai_pulse', 'resurrection'],
  'STALLED:DEAD': ['manual', 'health_cron'],
  'DEAD:ACTIVE': ['ai_pulse', 'resurrection'],
};

// project shape
export interface StateEvaluationInput {
  readonly state: ProjectState;
  readonly lastActivityAt: Date | null;
  readonly createdAt: Date;
}

function getTransitionKey(from: ProjectState, to: ProjectState): TransitionKey {
  return `${from}:${to}`;
}

export const stateMachine = {
  // check valid transition
  canTransition(from: ProjectState, to: ProjectState, context?: TransitionContext): boolean {
    if (from === to) return true;
    if (!TRANSITIONS[from].includes(to)) return false;
    if (!context) return true;

    const allowedSources = SOURCE_TRANSITIONS[getTransitionKey(from, to)];
    if (!allowedSources) return true;

    return allowedSources.includes(context.source);
  },

  // get next states
  getValidTransitions(state: ProjectState, context?: TransitionContext): readonly ProjectState[] {
    if (!context) {
      return TRANSITIONS[state];
    }

    return TRANSITIONS[state].filter((to) =>
      stateMachine.canTransition(state, to, context)
    );
  },

  // validate or throw
  validateTransition(from: ProjectState, to: ProjectState, context?: TransitionContext): void {
    if (!TRANSITIONS[from].includes(to) && from !== to) {
      const valid = TRANSITIONS[from].join(', ') || 'none';
      throw ApiError.badRequest(
        `Cannot transition from ${from} to ${to}. Valid transitions: ${valid}`
      );
    }

    if (context && !stateMachine.canTransition(from, to, context)) {
      const valid = stateMachine.getValidTransitions(from, context).join(', ') || 'none';
      throw ApiError.badRequest(
        `${context.source} transitions cannot move a project from ${from} to ${to}. Valid transitions for ${context.source}: ${valid}`
      );
    }
  },

  evaluateState(project: StateEvaluationInput): ProjectState {
    // shipped is terminal
    if (project.state === 'SHIPPED') return 'SHIPPED';

    // dead stays dead UNLESS explicitly transitioned externally
    if (project.state === 'DEAD') return 'DEAD';

    // get days since last activity
    const referenceDate = project.lastActivityAt || project.createdAt;
    const daysSince = daysBetween(referenceDate, new Date());

    // Check decay thresholds
    const isDead = daysSince >= HEALTH_CONFIG.deadDays;
    const isStalled = daysSince >= HEALTH_CONFIG.stalledDays;

    if (project.state === 'BORN') {
      if (isDead) return 'DEAD';
      if (isStalled) return 'STALLED';
      return 'BORN'; // Stay BORN until explicit activity moves it to ACTIVE
    }

    if (project.state === 'ACTIVE' || project.state === 'STALLED') {
      if (isDead) return 'DEAD';
      if (isStalled) return 'STALLED';
      return 'ACTIVE';
    }

    return project.state;
  },
};
