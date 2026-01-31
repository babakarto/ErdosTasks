import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculatePoints,
  formatPointsBreakdown,
  BASE_POINTS,
  BONUS_POINTS,
  type PointsCalculationResult,
} from './points';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ count: 0, error: null })),
      })),
    })),
  })),
};

describe('Points Calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BASE_POINTS', () => {
    it('has correct point values', () => {
      expect(BASE_POINTS.easy).toBe(5);
      expect(BASE_POINTS.medium).toBe(10);
      expect(BASE_POINTS.hard).toBe(20);
      expect(BASE_POINTS.extreme).toBe(40);
    });
  });

  describe('BONUS_POINTS', () => {
    it('has correct bonus values', () => {
      expect(BONUS_POINTS.FIRST_SOLVER).toBe(5);
      expect(BONUS_POINTS.COUNTEREXAMPLE).toBe(100);
      expect(BONUS_POINTS.PERFECT_DAY).toBe(10);
    });
  });

  describe('calculatePoints', () => {
    it('awards base points for a normal submission', async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 5, error: null })), // Not first solver
            })),
          })),
        })),
      };

      const result = await calculatePoints({
        task: { id: 'task-1', type: 'COMPUTE', points: 10 },
        answer: { x: 1, y: 2, z: 3 },
        supabase: mockClient as any,
      });

      expect(result.basePoints).toBe(10);
      expect(result.firstSolverBonus).toBe(0);
      expect(result.counterexampleBonus).toBe(0);
      expect(result.totalPoints).toBe(10);
      expect(result.isFirstSolver).toBe(false);
    });

    it('awards first solver bonus when first to solve', async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 0, error: null })), // First solver
            })),
          })),
        })),
      };

      const result = await calculatePoints({
        task: { id: 'task-1', type: 'COMPUTE', points: 10 },
        answer: { x: 1, y: 2, z: 3 },
        supabase: mockClient as any,
      });

      expect(result.basePoints).toBe(10);
      expect(result.firstSolverBonus).toBe(5);
      expect(result.totalPoints).toBe(15);
      expect(result.isFirstSolver).toBe(true);
    });

    it('awards counterexample bonus for SEARCH tasks with found=true', async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 0, error: null })),
            })),
          })),
        })),
      };

      const result = await calculatePoints({
        task: { id: 'task-1', type: 'SEARCH', points: 50 },
        answer: { found: true, counterexample: 12345 },
        supabase: mockClient as any,
      });

      expect(result.basePoints).toBe(50);
      expect(result.counterexampleBonus).toBe(100);
      expect(result.totalPoints).toBe(155); // 50 + 5 (first) + 100 (counterexample)
      expect(result.foundCounterexample).toBe(true);
    });

    it('does not award counterexample bonus for SEARCH with found=false', async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 0, error: null })),
            })),
          })),
        })),
      };

      const result = await calculatePoints({
        task: { id: 'task-1', type: 'SEARCH', points: 50 },
        answer: { found: false },
        supabase: mockClient as any,
      });

      expect(result.counterexampleBonus).toBe(0);
      expect(result.foundCounterexample).toBe(false);
    });

    it('does not award counterexample bonus for non-SEARCH tasks', async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ count: 0, error: null })),
            })),
          })),
        })),
      };

      const result = await calculatePoints({
        task: { id: 'task-1', type: 'COMPUTE', points: 10 },
        answer: { found: true }, // Even with found=true, COMPUTE doesn't get bonus
        supabase: mockClient as any,
      });

      expect(result.counterexampleBonus).toBe(0);
      expect(result.foundCounterexample).toBe(false);
    });
  });

  describe('formatPointsBreakdown', () => {
    it('formats base points only', () => {
      const result: PointsCalculationResult = {
        basePoints: 10,
        firstSolverBonus: 0,
        counterexampleBonus: 0,
        totalPoints: 10,
        isFirstSolver: false,
        foundCounterexample: false,
      };

      expect(formatPointsBreakdown(result)).toBe('10 base = 10 total');
    });

    it('formats with first solver bonus', () => {
      const result: PointsCalculationResult = {
        basePoints: 10,
        firstSolverBonus: 5,
        counterexampleBonus: 0,
        totalPoints: 15,
        isFirstSolver: true,
        foundCounterexample: false,
      };

      expect(formatPointsBreakdown(result)).toBe(
        '10 base, +5 first solver = 15 total'
      );
    });

    it('formats with counterexample bonus', () => {
      const result: PointsCalculationResult = {
        basePoints: 50,
        firstSolverBonus: 5,
        counterexampleBonus: 100,
        totalPoints: 155,
        isFirstSolver: true,
        foundCounterexample: true,
      };

      expect(formatPointsBreakdown(result)).toBe(
        '50 base, +5 first solver, +100 counterexample! = 155 total'
      );
    });
  });
});
