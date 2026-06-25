import { describe, expect, it } from "vitest";
import { stateMachine } from "@/lib/state-machine";
import { deriveStateFromHealth } from "@/services/health.service";

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

describe("stateMachine.canTransition", () => {
  it("allows matrix-valid transitions without a source context", () => {
    expect(stateMachine.canTransition("BORN", "ACTIVE")).toBe(true);
    expect(stateMachine.canTransition("ACTIVE", "DEAD")).toBe(true);
    expect(stateMachine.canTransition("STALLED", "ACTIVE")).toBe(true);
    expect(stateMachine.canTransition("DEAD", "ACTIVE")).toBe(true);
  });

  it("rejects matrix-invalid transitions", () => {
    expect(stateMachine.canTransition("BORN", "SHIPPED")).toBe(false);
    expect(stateMachine.canTransition("ACTIVE", "BORN")).toBe(false);
    expect(stateMachine.canTransition("STALLED", "SHIPPED")).toBe(false);
    expect(stateMachine.canTransition("SHIPPED", "ACTIVE")).toBe(false);
  });

  it("blocks manual revival transitions", () => {
    expect(
      stateMachine.canTransition("STALLED", "ACTIVE", { source: "manual" }),
    ).toBe(false);
    expect(
      stateMachine.canTransition("DEAD", "ACTIVE", { source: "manual" }),
    ).toBe(false);
  });

  it("allows AI-driven revival transitions", () => {
    expect(
      stateMachine.canTransition("STALLED", "ACTIVE", { source: "ai_pulse" }),
    ).toBe(true);
    expect(
      stateMachine.canTransition("DEAD", "ACTIVE", { source: "ai_pulse" }),
    ).toBe(true);
  });

  it("allows user activity and health checks to repair stalled projects with fresh activity", () => {
    expect(
      stateMachine.canTransition("STALLED", "ACTIVE", {
        source: "user_activity",
      }),
    ).toBe(true);
    expect(
      stateMachine.canTransition("STALLED", "ACTIVE", {
        source: "health_cron",
      }),
    ).toBe(true);
  });

  it("allows all health_cron transitions needed by health-derived state", () => {
    expect(
      stateMachine.canTransition("BORN", "STALLED", { source: "health_cron" }),
    ).toBe(true);
    expect(
      stateMachine.canTransition("BORN", "DEAD", { source: "health_cron" }),
    ).toBe(true);
    expect(
      stateMachine.canTransition("ACTIVE", "STALLED", {
        source: "health_cron",
      }),
    ).toBe(true);
    expect(
      stateMachine.canTransition("ACTIVE", "DEAD", { source: "health_cron" }),
    ).toBe(true);
    expect(
      stateMachine.canTransition("STALLED", "ACTIVE", {
        source: "health_cron",
      }),
    ).toBe(true);
    expect(
      stateMachine.canTransition("STALLED", "DEAD", { source: "health_cron" }),
    ).toBe(true);
  });

  it("does not allow user activity to revive dead projects directly", () => {
    expect(
      stateMachine.canTransition("DEAD", "ACTIVE", { source: "user_activity" }),
    ).toBe(false);
  });

  it("allows same-state transitions for every source", () => {
    expect(
      stateMachine.canTransition("BORN", "BORN", { source: "manual" }),
    ).toBe(true);
    expect(
      stateMachine.canTransition("ACTIVE", "ACTIVE", { source: "health_cron" }),
    ).toBe(true);
  });
});

describe("deriveStateFromHealth", () => {
  it("keeps terminal states terminal", () => {
    expect(deriveStateFromHealth(100, "SHIPPED", 0)).toBe("SHIPPED");
    expect(deriveStateFromHealth(100, "DEAD", 0)).toBe("DEAD");
  });

  it("maps health bands to lifecycle states", () => {
    expect(deriveStateFromHealth(70, "STALLED", 0)).toBe("ACTIVE");
    expect(deriveStateFromHealth(30, "ACTIVE", 0)).toBe("STALLED");
    expect(deriveStateFromHealth(29.9, "ACTIVE", 0)).toBe("STALLED");
    expect(deriveStateFromHealth(10, "STALLED", 2)).toBe("STALLED");
  });

  it("keeps a fresh healthy BORN project in BORN (waiting for ai_pulse)", () => {
    expect(deriveStateFromHealth(70, "BORN", 0)).toBe("BORN");
    expect(deriveStateFromHealth(100, "BORN", 2)).toBe("BORN");
  });

  it("decays a BORN project to STALLED after stalledDays regardless of health score", () => {
    expect(deriveStateFromHealth(71, "BORN", 10)).toBe("STALLED");
    expect(deriveStateFromHealth(100, "BORN", 7)).toBe("STALLED");
  });

  it("decays a BORN project straight to DEAD after deadDays regardless of health score", () => {
    expect(deriveStateFromHealth(71, "BORN", 30)).toBe("DEAD");
    expect(deriveStateFromHealth(100, "BORN", 45)).toBe("DEAD");
  });
});

describe("stateMachine.getValidTransitions", () => {
  it("returns the full matrix when no source is provided", () => {
    expect(stateMachine.getValidTransitions("BORN")).toEqual([
      "ACTIVE",
      "STALLED",
      "DEAD",
    ]);
    expect(stateMachine.getValidTransitions("ACTIVE")).toEqual([
      "STALLED",
      "SHIPPED",
      "DEAD",
    ]);
    expect(stateMachine.getValidTransitions("STALLED")).toEqual([
      "ACTIVE",
      "DEAD",
    ]);
    expect(stateMachine.getValidTransitions("DEAD")).toEqual(["ACTIVE"]);
    expect(stateMachine.getValidTransitions("SHIPPED")).toEqual([]);
  });

  it("filters transitions by source when context is provided", () => {
    expect(
      stateMachine.getValidTransitions("STALLED", { source: "manual" }),
    ).toEqual(["DEAD"]);
    expect(
      stateMachine.getValidTransitions("STALLED", { source: "user_activity" }),
    ).toEqual(["ACTIVE"]);
    expect(
      stateMachine.getValidTransitions("DEAD", { source: "manual" }),
    ).toEqual([]);
    expect(
      stateMachine.getValidTransitions("DEAD", { source: "ai_pulse" }),
    ).toEqual(["ACTIVE"]);
  });
});

describe("stateMachine.validateTransition", () => {
  it("does not throw for valid transitions", () => {
    expect(() =>
      stateMachine.validateTransition("ACTIVE", "DEAD"),
    ).not.toThrow();
    expect(() =>
      stateMachine.validateTransition("DEAD", "ACTIVE", { source: "ai_pulse" }),
    ).not.toThrow();
  });

  it("throws for matrix-invalid transitions", () => {
    expect(() => stateMachine.validateTransition("SHIPPED", "ACTIVE")).toThrow(
      /Cannot transition/,
    );
  });

  it("throws a descriptive error for invalid sources", () => {
    expect(() =>
      stateMachine.validateTransition("STALLED", "ACTIVE", {
        source: "manual",
      }),
    ).toThrow(
      /manual transitions cannot move a project from STALLED to ACTIVE/,
    );
  });
});

describe("stateMachine.evaluateState", () => {
  it("keeps SHIPPED terminal", () => {
    const result = stateMachine.evaluateState({
      state: "SHIPPED",
      lastActivityAt: daysAgo(30),
      createdAt: daysAgo(60),
    });

    expect(result).toBe("SHIPPED");
  });

  it("keeps DEAD terminal during health evaluation", () => {
    const result = stateMachine.evaluateState({
      state: "DEAD",
      lastActivityAt: daysAgo(10),
      createdAt: daysAgo(60),
    });

    expect(result).toBe("DEAD");
  });

  it("keeps a fresh BORN project in BORN", () => {
    const result = stateMachine.evaluateState({
      state: "BORN",
      lastActivityAt: null,
      createdAt: daysAgo(0),
    });

    expect(result).toBe("BORN");
  });

  it("decays BORN to STALLED after exactly 7 days", () => {
    const result = stateMachine.evaluateState({
      state: "BORN",
      lastActivityAt: null,
      createdAt: daysAgo(7),
    });

    expect(result).toBe("STALLED");
  });

  it("decays BORN straight to DEAD after exactly 30 days without activity", () => {
    const result = stateMachine.evaluateState({
      state: "BORN",
      lastActivityAt: null,
      createdAt: daysAgo(30),
    });

    expect(result).toBe("DEAD");
  });

  it("decays ACTIVE to STALLED after exactly 7 days of inactivity", () => {
    const result = stateMachine.evaluateState({
      state: "ACTIVE",
      lastActivityAt: daysAgo(7),
      createdAt: daysAgo(30),
    });

    expect(result).toBe("STALLED");
  });

  it("decays ACTIVE straight to DEAD after 30 days of inactivity", () => {
    const result = stateMachine.evaluateState({
      state: "ACTIVE",
      lastActivityAt: daysAgo(30),
      createdAt: daysAgo(30),
    });

    expect(result).toBe("DEAD");
  });

  it("returns ACTIVE again when a stalled project has fresh activity", () => {
    const result = stateMachine.evaluateState({
      state: "STALLED",
      lastActivityAt: daysAgo(0),
      createdAt: daysAgo(30),
    });

    expect(result).toBe("ACTIVE");
  });

  it("falls back to createdAt when lastActivityAt is null", () => {
    const result = stateMachine.evaluateState({
      state: "ACTIVE",
      lastActivityAt: null,
      createdAt: daysAgo(30),
    });

    expect(result).toBe("DEAD");
  });
});
