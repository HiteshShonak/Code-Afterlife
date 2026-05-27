/**
 * Trending score formula for Code Afterlife.
 *
 * Hacker News-style time-decay: projects with recent engagement bubble up;
 * yesterday's news falls fast. Score is stored on Project.trendingScore and
 * recalculated on every like / comment / vote and in the daily cron batch.
 *
 * Formula:
 *   score = (likes × 3 + comments × 2 + votes × 1 + health × 0.5)
 *           ─────────────────────────────────────────────────────────
 *                         (ageInHours + 2) ^ 1.5
 *
 * +2  → prevents division-by-zero for brand-new projects and gives them
 *        a small initial score boost.
 * 1.5 → aggressive decay exponent (a 24h-old post is ~5× less relevant).
 */

export interface TrendingInput {
  likeCount:    number;
  commentCount: number;
  voteCount:    number;
  health:       number;
  createdAt:    Date;
}

/**
 * Calculate trending score from engagement metrics and project age.
 * Returns a float rounded to 4 decimal places for DB storage.
 */
export function calculateTrendingScore(input: TrendingInput): number {
  const { likeCount, commentCount, voteCount, health, createdAt } = input;

  const ageMs      = Date.now() - createdAt.getTime();
  const ageInHours = ageMs / (1000 * 60 * 60);

  const engagementScore =
    likeCount * 3 +
    commentCount * 2 +
    voteCount * 1 +
    health * 0.5;

  const score = engagementScore / Math.pow(ageInHours + 2, 1.5);

  return Math.round(score * 10_000) / 10_000;
}

/**
 * Threshold above which a project is considered "Trending"
 * and earns the 🔥 badge on the card.
 */
export const TRENDING_THRESHOLD = 0.5;
