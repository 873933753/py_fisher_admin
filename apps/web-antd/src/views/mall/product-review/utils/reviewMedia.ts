export function createReviewMediaUid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `review-media-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
