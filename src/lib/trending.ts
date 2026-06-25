// trending formula

export interface TrendingInput {
  likeCount:    number;
  commentCount: number;
  voteCount:    number;
  viewCount:    number;
  health:       number;
  createdAt:    Date;
}

// calc score
export function calculateTrendingScore(input: TrendingInput): number {
  const { likeCount, commentCount, voteCount, viewCount, health, createdAt } = input;

  const ageMs      = Date.now() - createdAt.getTime();
  const ageInHours = ageMs / (1000 * 60 * 60);

  const voteWeight = voteCount > 0 ? voteCount * 10 : voteCount * 15;

  const engagementScore =
    voteWeight +
    likeCount * 4 +
    commentCount * 3 +
    viewCount * 1 +
    (health * 0.2);

  const score = engagementScore / Math.pow(ageInHours + 2, 1.5);

  return Math.round(score * 10_000) / 10_000;
}

// min score for trending
export const TRENDING_THRESHOLD = 0.5;
