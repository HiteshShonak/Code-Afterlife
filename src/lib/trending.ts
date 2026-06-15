// trending formula

export interface TrendingInput {
  likeCount:    number;
  commentCount: number;
  voteCount:    number;
  health:       number;
  createdAt:    Date;
}

// calc score
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

// min score for trending
export const TRENDING_THRESHOLD = 0.5;
