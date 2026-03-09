import { ApplicationStatus } from "./models";

export type Actor = "candidate" | "employer" | "system";

export interface StatusTransition {
  to: ApplicationStatus;
  allowedActors: Actor[];
  triggersNotification: boolean;
  triggersEmail: boolean;
  requiresAudit: boolean;
}

export interface StatusDefinition {
  isTerminal: boolean;
  allowedTransitions: StatusTransition[];
}

export const APPLICATION_STATE_MACHINE: Record<ApplicationStatus, StatusDefinition> = {
  applied: {
    isTerminal: false,
    allowedTransitions: [
      { to: "shortlisted", allowedActors: ["employer"], triggersNotification: true, triggersEmail: false, requiresAudit: true },
      { to: "viewed", allowedActors: ["employer"], triggersNotification: true, triggersEmail: false, requiresAudit: false },
      { to: "interview", allowedActors: ["employer"], triggersNotification: true, triggersEmail: true, requiresAudit: true },
      { to: "not_selected", allowedActors: ["employer"], triggersNotification: true, triggersEmail: true, requiresAudit: true },
      { to: "position_closed", allowedActors: ["employer", "system"], triggersNotification: true, triggersEmail: false, requiresAudit: true },
    ],
  },
  shortlisted: {
    isTerminal: false,
    allowedTransitions: [
      { to: "applied", allowedActors: ["employer"], triggersNotification: false, triggersEmail: false, requiresAudit: true }, // Removal from shortlist
      { to: "viewed", allowedActors: ["employer"], triggersNotification: false, triggersEmail: false, requiresAudit: false },
      { to: "interview", allowedActors: ["employer"], triggersNotification: true, triggersEmail: true, requiresAudit: true },
      { to: "not_selected", allowedActors: ["employer"], triggersNotification: true, triggersEmail: true, requiresAudit: true },
      { to: "position_closed", allowedActors: ["employer", "system"], triggersNotification: true, triggersEmail: false, requiresAudit: true },
    ],
  },
  viewed: {
    isTerminal: false,
    allowedTransitions: [
      { to: "shortlisted", allowedActors: ["employer"], triggersNotification: true, triggersEmail: false, requiresAudit: true },
      { to: "interview", allowedActors: ["employer"], triggersNotification: true, triggersEmail: true, requiresAudit: true },
      { to: "not_selected", allowedActors: ["employer"], triggersNotification: true, triggersEmail: true, requiresAudit: true },
      { to: "position_closed", allowedActors: ["employer", "system"], triggersNotification: true, triggersEmail: false, requiresAudit: true },
    ],
  },
  interview: {
    isTerminal: false,
    allowedTransitions: [
      { to: "hired", allowedActors: ["employer"], triggersNotification: true, triggersEmail: true, requiresAudit: true },
      { to: "not_selected", allowedActors: ["employer"], triggersNotification: true, triggersEmail: true, requiresAudit: true },
      { to: "position_closed", allowedActors: ["employer", "system"], triggersNotification: true, triggersEmail: false, requiresAudit: true },
    ],
  },
  hired: {
    isTerminal: true,
    allowedTransitions: [], // Terminal state
  },
  not_selected: {
    isTerminal: true,
    allowedTransitions: [], // Terminal state
  },
  position_closed: {
    isTerminal: true,
    allowedTransitions: [], // Terminal state
  },
};

export class InvalidTransitionError extends Error {
  constructor(from: ApplicationStatus, to: ApplicationStatus, actor: Actor) {
    super(`Invalid status transition from '${from}' to '${to}' for actor '${actor}'`);
    this.name = "InvalidTransitionError";
  }
}

/**
 * Validates if a transition is allowed according to the state machine.
 * Throws InvalidTransitionError if the transition is invalid.
 */
export function validateTransition(from: ApplicationStatus, to: ApplicationStatus, actor: Actor): StatusTransition {
  if (from === to) {
    // Self-transitions are technically no-ops, but we can treat them as valid and not returning action triggers
    return { to, allowedActors: [actor], triggersNotification: false, triggersEmail: false, requiresAudit: false };
  }

  const state = APPLICATION_STATE_MACHINE[from];
  
  if (!state) {
    throw new Error(`Unknown initial status: '${from}'`);
  }

  if (state.isTerminal) {
    throw new InvalidTransitionError(from, to, actor);
  }

  const transition = state.allowedTransitions.find(t => t.to === to);
  
  if (!transition) {
    throw new InvalidTransitionError(from, to, actor);
  }

  if (!transition.allowedActors.includes(actor)) {
    throw new InvalidTransitionError(from, to, actor);
  }

  return transition;
}

/**
 * Gets all allowed next statuses for a given current status and actor
 */
export function getAllowedTransitions(from: ApplicationStatus, actor: Actor): ApplicationStatus[] {
  const state = APPLICATION_STATE_MACHINE[from];
  if (!state || state.isTerminal) return [];
  
  return state.allowedTransitions
    .filter(t => t.allowedActors.includes(actor))
    .map(t => t.to);
}
