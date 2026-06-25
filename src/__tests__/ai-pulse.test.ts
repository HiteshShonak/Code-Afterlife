import { describe, expect, it } from 'vitest';
import {
  getCommitDate,
  getFreshCommitsForPulse,
  getLatestCommitDate,
  getPulseSinceDate,
  type GitHubCommit,
} from '@/lib/ai-pulse';

function commit(date: Date, message = 'work'): GitHubCommit {
  return {
    author: { id: 1, login: 'owner' },
    commit: {
      message,
      author: { date: date.toISOString() },
      committer: { date: date.toISOString() },
    },
  };
}

describe('ai pulse commit freshness', () => {
  const now = new Date('2026-05-28T12:00:00.000Z');
  const createdAt = new Date('2026-05-25T12:00:00.000Z');

  it('reads the GitHub commit timestamp', () => {
    const date = new Date('2026-05-28T10:00:00.000Z');

    expect(getCommitDate(commit(date))?.toISOString()).toBe(date.toISOString());
  });

  it('ignores commits older than the 24 hour activity window', () => {
    const staleCommit = commit(new Date('2026-05-27T11:59:59.000Z'), 'stale');
    const freshCommit = commit(new Date('2026-05-27T12:00:00.000Z'), 'fresh');

    const freshCommits = getFreshCommitsForPulse(
      [staleCommit, freshCommit],
      {
        createdAt,
        lastActivityAt: new Date('2026-05-26T12:00:00.000Z'),
        lastPulseCheckAt: null,
      },
      now,
    );

    expect(freshCommits).toEqual([freshCommit]);
  });

  it('ignores commits that are not newer than lastActivityAt', () => {
    const alreadyRecorded = commit(new Date('2026-05-28T08:00:00.000Z'));
    const newCommit = commit(new Date('2026-05-28T09:00:00.000Z'));

    const freshCommits = getFreshCommitsForPulse(
      [alreadyRecorded, newCommit],
      {
        createdAt,
        lastActivityAt: new Date('2026-05-28T08:30:00.000Z'),
        lastPulseCheckAt: null,
      },
      now,
    );

    expect(freshCommits).toEqual([newCommit]);
  });

  it('uses the latest qualifying commit as the lifecycle activity timestamp', () => {
    const older = commit(new Date('2026-05-28T08:00:00.000Z'));
    const latest = commit(new Date('2026-05-28T10:00:00.000Z'));

    expect(getLatestCommitDate([older, latest])?.toISOString()).toBe(
      '2026-05-28T10:00:00.000Z',
    );
  });

  it('does not fetch earlier than the active freshness window', () => {
    const sinceDate = getPulseSinceDate(
      {
        createdAt,
        lastActivityAt: new Date('2026-05-24T12:00:00.000Z'),
        lastPulseCheckAt: null,
      },
      now,
    );

    expect(sinceDate.toISOString()).toBe('2026-05-27T12:00:00.000Z');
  });

  it('uses last pulse with overlap when it is newer than the freshness cutoff', () => {
    const sinceDate = getPulseSinceDate(
      {
        createdAt,
        lastActivityAt: new Date('2026-05-28T06:00:00.000Z'),
        lastPulseCheckAt: new Date('2026-05-28T11:00:00.000Z'),
      },
      now,
    );

    expect(sinceDate.toISOString()).toBe('2026-05-28T10:55:00.000Z');
  });
});
