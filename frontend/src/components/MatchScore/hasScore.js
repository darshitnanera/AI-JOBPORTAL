/**
 * True only when the API actually returned a numeric match score.
 * Callers must render nothing when this is false — never a placeholder,
 * a zero, or an invented percentage (design system §7).
 */
export const hasScore = (score) =>
  score !== null && score !== undefined && Number.isFinite(Number(score));

export default hasScore;
