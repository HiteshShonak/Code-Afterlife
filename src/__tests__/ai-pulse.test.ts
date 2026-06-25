import { describe, expect, it } from "vitest";
import {
  calcHealthFromCommits,
  getCommitDate,
  getFreshCommitsForPulse,
  getLatestCommitDate,
  getPulseLifecycleContext,
  getPulseSinceDate,
  getPulseUntilDate,
  sanitizeFutureDate,
  type GitHubCommit,
} from "@/lib/ai-pulse";

function commit(date: Date, message = "work"): GitHubCommit {
  return {
    author: { id: 1, login: "owner" },
    commit: {
      message,
      author: { date: date.toISOString() },
      committer: { date: date.toISOString() },
    },
  };
}

describe("ai pulse commit freshness", () => {
  const now = new Date("2026-05-28T12:00:00.000Z");
  const createdAt = new Date("2026-05-25T12:00:00.000Z");

  it("reads the GitHub commit timestamp", () => {
    const date = new Date("2026-05-28T10:00:00.000Z");

    expect(getCommitDate(commit(date))?.toISOString()).toBe(date.toISOString());
  });

  it("ignores commits older than the dead-project freshness window", () => {
    const staleCommit = commit(new Date("2026-04-28T11:59:59.000Z"), "stale");
    const freshCommit = commit(new Date("2026-04-28T12:00:00.000Z"), "fresh");

    const freshCommits = getFreshCommitsForPulse(
      [staleCommit, freshCommit],
      {
        createdAt: new Date("2026-04-01T12:00:00.000Z"),
        lastActivityAt: new Date("2026-04-01T12:00:00.000Z"),
        lastPulseCheckAt: null,
      },
      now,
    );

    expect(freshCommits).toEqual([freshCommit]);
  });

  it("ignores commits that are not newer than lastActivityAt", () => {
    const alreadyRecorded = commit(new Date("2026-05-28T08:00:00.000Z"));
    const newCommit = commit(new Date("2026-05-28T09:00:00.000Z"));

    const freshCommits = getFreshCommitsForPulse(
      [alreadyRecorded, newCommit],
      {
        createdAt,
        lastActivityAt: new Date("2026-05-28T08:30:00.000Z"),
        lastPulseCheckAt: null,
      },
      now,
    );

    expect(freshCommits).toEqual([newCommit]);
  });

  it("uses the latest qualifying commit as the lifecycle activity timestamp", () => {
    const older = commit(new Date("2026-05-28T08:00:00.000Z"));
    const latest = commit(new Date("2026-05-28T10:00:00.000Z"));

    expect(getLatestCommitDate([older, latest])?.toISOString()).toBe(
      "2026-05-28T10:00:00.000Z",
    );
  });

  it("does not fetch earlier than the stalled freshness window", () => {
    const sinceDate = getPulseSinceDate(
      {
        createdAt,
        lastActivityAt: new Date("2026-05-24T12:00:00.000Z"),
        lastPulseCheckAt: null,
      },
      now,
    );

    expect(sinceDate.toISOString()).toBe("2026-05-25T12:00:00.000Z");
  });

  it("uses the last pulse with a 24-hour overlap when it is newer than the freshness cutoff", () => {
    const sinceDate = getPulseSinceDate(
      {
        createdAt,
        lastActivityAt: new Date("2026-05-28T06:00:00.000Z"),
        lastPulseCheckAt: new Date("2026-05-28T11:00:00.000Z"),
      },
      now,
    );

    expect(sinceDate.toISOString()).toBe("2026-05-27T11:00:00.000Z");
  });

  it("rejects commits that are more than five minutes in the future", () => {
    const acceptableFutureCommit = commit(
      new Date("2026-05-28T12:04:59.000Z"),
      "clock skew",
    );
    const invalidFutureCommit = commit(
      new Date("2026-05-28T12:05:01.000Z"),
      "future",
    );

    const freshCommits = getFreshCommitsForPulse(
      [acceptableFutureCommit, invalidFutureCommit],
      {
        createdAt,
        lastActivityAt: new Date("2026-05-28T08:30:00.000Z"),
        lastPulseCheckAt: null,
      },
      now,
    );

    expect(freshCommits).toEqual([acceptableFutureCommit]);
  });

  it("caps the fetch window to five minutes of future clock skew", () => {
    expect(getPulseUntilDate(now).toISOString()).toBe(
      "2026-05-28T12:05:00.000Z",
    );
  });
});

describe("ai pulse lifecycle context", () => {
  it("keeps BORN projects in activation mode until first owner activity", () => {
    expect(getPulseLifecycleContext("BORN")).toEqual({
      isDeadResurrection: false,
      shouldActivate: true,
    });
  });

  it("treats ACTIVE projects as observations rather than revivals", () => {
    expect(getPulseLifecycleContext("ACTIVE")).toEqual({
      isDeadResurrection: false,
      shouldActivate: false,
    });
  });

  it("treats DEAD projects as resurrection candidates", () => {
    expect(getPulseLifecycleContext("DEAD")).toEqual({
      isDeadResurrection: true,
      shouldActivate: true,
    });
  });

  it("treats SHIPPED projects as observation-only", () => {
    expect(getPulseLifecycleContext("SHIPPED")).toEqual({
      isDeadResurrection: false,
      shouldActivate: false,
    });
  });
});

describe("ai pulse health updates", () => {
  it("keeps shipped project health in the shipped band", () => {
    expect(calcHealthFromCommits(0, 20, "SHIPPED")).toBe(90.1);
    expect(calcHealthFromCommits(200, 99, "SHIPPED")).toBe(99.9);
  });

  it("bumps ACTIVE health by 3 per commit capped at 15", () => {
    expect(calcHealthFromCommits(1, 85, "ACTIVE")).toBe(88);
    expect(calcHealthFromCommits(5, 85, "ACTIVE")).toBe(95);
    expect(calcHealthFromCommits(10, 85, "ACTIVE")).toBe(95);
  });

  it("does not crash a high score when only 1 commit is found", () => {
    const result = calcHealthFromCommits(1, 91, "ACTIVE");
    expect(result).toBeGreaterThanOrEqual(91);
    expect(result).toBeLessThanOrEqual(95);
  });

  it("caps STALLED health at stable threshold", () => {
    expect(calcHealthFromCommits(5, 50, "STALLED")).toBe(60);
  });

  it("caps DEAD health at 45", () => {
    expect(calcHealthFromCommits(5, 40, "DEAD")).toBe(45);
  });
});

describe("sanitizeFutureDate", () => {
  const now = new Date("2026-06-05T12:00:00.000Z");

  it("returns null for a future date", () => {
    expect(sanitizeFutureDate(new Date("2026-06-26T00:00:00.000Z"), now)).toBeNull();
  });

  it("returns the date when it is in the past", () => {
    const past = new Date("2026-06-04T10:00:00.000Z");
    expect(sanitizeFutureDate(past, now)).toEqual(past);
  });

  it("returns null when date is null", () => {
    expect(sanitizeFutureDate(null, now)).toBeNull();
  });

  it("returns null when date is undefined", () => {
    expect(sanitizeFutureDate(undefined, now)).toBeNull();
  });
});
