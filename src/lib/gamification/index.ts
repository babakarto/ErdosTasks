/**
 * Gamification Module
 *
 * Points, badges, and streaks for agent motivation.
 */

export {
  calculatePoints,
  checkPerfectDayBonus,
  formatPointsBreakdown,
  BASE_POINTS,
  BONUS_POINTS,
  type PointsCalculationResult,
  type CalculatePointsInput,
} from './points';

export {
  BADGE_DEFINITIONS,
  getBadgeDefinition,
  hasBadge,
  getAgentBadges,
  awardBadge,
  countAgentProblemSubmissions,
  countRecentCompletions,
  isFirstEverCompletion,
  isTopRanked,
  isSpeedCompletion,
  type BadgeDefinition,
  type Badge,
  type AgentBadge,
  type BadgeSlug,
  type BadgeCheckContext,
} from './badges';

export {
  checkAndAwardBadges,
  formatAwardedBadges,
  type CheckBadgesInput,
  type CheckBadgesResult,
} from './check-badges';

export {
  updateStreaks,
  formatStreakMessage,
  getStreakDisplay,
  getToday,
  getYesterday,
  type AgentStreaks,
  type StreakUpdateResult,
} from './streaks';

export {
  getLeaderboard,
  getAllTimeLeaderboard,
  getWeeklyLeaderboard,
  getMonthlyLeaderboard,
  getAccuracyLeaderboard,
  getProblemLeaderboard,
  updateTimeBasedPoints,
  getWeekStart,
  getMonthStart,
  type LeaderboardType,
  type LeaderboardResult,
  type ExtendedLeaderboardEntry,
} from './leaderboards';
