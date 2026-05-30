/**
 * Calculate points for a prediction.
 * Returns { points, reason }
 */
function calculatePoints(match, prediction) {
  const { home_score: actualHome, away_score: actualAway, ended_with_penalties } = match;
  const { home_score: predHome, away_score: predAway, predict_penalties } = prediction;

  if (actualHome === null || actualAway === null) return { points: null, reason: 'not_finished' };
  if (predHome === null || predAway === null) return { points: 0, reason: 'no_prediction' };

  // Penalty shootout prediction in knockout rounds
  if (predict_penalties && ended_with_penalties) return { points: 5, reason: 'penalties_correct' };
  if (predict_penalties && !ended_with_penalties) return { points: 0, reason: 'penalties_wrong' };

  const actualDiff = actualHome - actualAway;
  const predDiff = predHome - predAway;
  const actualResult = Math.sign(actualDiff); // -1, 0, 1
  const predResult = Math.sign(predDiff);

  // Exact score
  if (predHome === actualHome && predAway === actualAway) return { points: 3, reason: 'exact' };

  // Draw cases
  if (actualResult === 0) {
    if (predResult !== 0) return { points: 0, reason: 'wrong_result' };
    // Both drew: check goal difference from correct draw
    const diff = Math.abs(predHome - actualHome);
    if (diff <= 1) return { points: 2, reason: 'draw_close' };
    return { points: 1, reason: 'draw_winner' };
  }

  // Win/loss cases
  if (predResult !== actualResult) return { points: 0, reason: 'wrong_result' };
  if (predDiff === actualDiff) return { points: 2, reason: 'correct_diff' };
  return { points: 1, reason: 'correct_winner' };
}

module.exports = { calculatePoints };
