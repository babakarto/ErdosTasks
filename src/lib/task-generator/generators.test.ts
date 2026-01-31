import { describe, it, expect } from 'vitest';
import {
  generateTaskForProblem,
  generateRandomTask,
  generateTasks,
  generateBalancedTasks,
  generateDifficultyBalancedTasks,
  SUPPORTED_PROBLEMS,
  isSupportedProblem,
} from './index';
import { generateErdosStrausTask, generateErdosStrausCompute, generateErdosStrausVerify, generateErdosStrausSearch } from './erdos-straus';
import { generateCollatzTask, generateCollatzCompute, generateCollatzVerify, generateCollatzPattern } from './collatz';
import { generateSidonTask, generateSidonCompute, generateSidonVerification, generateSidonEnumeration } from './sidon';

describe('Erdős-Straus Task Generator', () => {
  describe('generateErdosStrausCompute', () => {
    it('generates valid COMPUTE tasks', () => {
      const task = generateErdosStrausCompute();
      expect(task.problem).toBe('erdos-straus');
      expect(task.type).toBe('COMPUTE');
      expect(task.parameters.n).toBeDefined();
      expect(typeof task.parameters.n).toBe('number');
      expect(task.parameters.n).toBeGreaterThanOrEqual(100);
      expect(task.verification_type).toBe('automatic');
    });

    it('respects difficulty preference', () => {
      const easyTask = generateErdosStrausCompute('easy');
      expect(easyTask.difficulty).toBe('easy');
      expect(easyTask.points).toBe(5);

      const hardTask = generateErdosStrausCompute('hard');
      expect(hardTask.difficulty).toBe('hard');
      expect(hardTask.points).toBe(20);
    });
  });

  describe('generateErdosStrausVerify', () => {
    it('generates valid VERIFY tasks', () => {
      const task = generateErdosStrausVerify();
      expect(task.problem).toBe('erdos-straus');
      expect(task.type).toBe('VERIFY');
      expect(task.parameters.range_start).toBeDefined();
      expect(task.parameters.range_end).toBeDefined();
      expect(task.difficulty).toBe('medium');
      expect(task.points).toBe(15);
    });
  });

  describe('generateErdosStrausSearch', () => {
    it('generates valid SEARCH tasks', () => {
      const task = generateErdosStrausSearch();
      expect(task.problem).toBe('erdos-straus');
      expect(task.type).toBe('SEARCH');
      expect(task.parameters.range_start).toBeDefined();
      expect(task.parameters.range_end).toBeDefined();
      expect(task.difficulty).toBe('hard');
      expect(task.points).toBe(50);
    });
  });

  describe('generateErdosStrausTask', () => {
    it('generates random task types', () => {
      const types = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const task = generateErdosStrausTask();
        types.add(task.type);
      }
      // Should generate at least COMPUTE and VERIFY (SEARCH is rare)
      expect(types.has('COMPUTE')).toBe(true);
      expect(types.has('VERIFY')).toBe(true);
    });

    it('respects task type parameter', () => {
      const computeTask = generateErdosStrausTask('COMPUTE');
      expect(computeTask.type).toBe('COMPUTE');

      const verifyTask = generateErdosStrausTask('VERIFY');
      expect(verifyTask.type).toBe('VERIFY');
    });
  });
});

describe('Collatz Task Generator', () => {
  describe('generateCollatzCompute', () => {
    it('generates valid COMPUTE tasks', () => {
      const task = generateCollatzCompute();
      expect(task.problem).toBe('collatz');
      expect(task.type).toBe('COMPUTE');
      expect(task.parameters.n).toBeDefined();
      expect(task.parameters.metric).toBeDefined();
      expect(['stopping_time', 'max_value']).toContain(task.parameters.metric);
    });
  });

  describe('generateCollatzVerify', () => {
    it('generates valid VERIFY tasks', () => {
      const task = generateCollatzVerify();
      expect(task.problem).toBe('collatz');
      expect(task.type).toBe('VERIFY');
      expect(task.parameters.range_start).toBeDefined();
      expect(task.parameters.range_end).toBeDefined();
    });
  });

  describe('generateCollatzPattern', () => {
    it('generates valid PATTERN tasks', () => {
      const task = generateCollatzPattern();
      expect(task.problem).toBe('collatz');
      expect(task.type).toBe('PATTERN');
      expect(task.verification_type).toBe('community');
      expect(task.points).toBe(25);
    });
  });

  describe('generateCollatzTask', () => {
    it('generates random task types', () => {
      const types = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const task = generateCollatzTask();
        types.add(task.type);
      }
      expect(types.has('COMPUTE')).toBe(true);
      expect(types.has('VERIFY')).toBe(true);
    });
  });
});

describe('Sidon Task Generator', () => {
  describe('generateSidonEnumeration', () => {
    it('generates valid enumeration tasks', () => {
      const task = generateSidonEnumeration();
      expect(task.problem).toBe('sidon');
      expect(task.type).toBe('COMPUTE');
      expect(task.parameters.max_element).toBeDefined();
      expect(task.parameters.set_size).toBeDefined();
    });
  });

  describe('generateSidonVerification', () => {
    it('generates valid verification tasks', () => {
      const task = generateSidonVerification();
      expect(task.problem).toBe('sidon');
      expect(task.type).toBe('VERIFY');
      expect(Array.isArray(task.parameters.set)).toBe(true);
      expect((task.parameters.set as number[]).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('generateSidonCompute', () => {
    it('generates valid COMPUTE tasks', () => {
      const task = generateSidonCompute();
      expect(task.problem).toBe('sidon');
      expect(task.type).toBe('COMPUTE');
    });
  });

  describe('generateSidonTask', () => {
    it('generates random task types', () => {
      const types = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const task = generateSidonTask();
        types.add(task.type);
      }
      expect(types.has('COMPUTE')).toBe(true);
      expect(types.has('VERIFY')).toBe(true);
    });
  });
});

describe('Central Task Generator', () => {
  describe('isSupportedProblem', () => {
    it('returns true for supported problems', () => {
      expect(isSupportedProblem('erdos-straus')).toBe(true);
      expect(isSupportedProblem('collatz')).toBe(true);
      expect(isSupportedProblem('sidon')).toBe(true);
    });

    it('returns false for unsupported problems', () => {
      expect(isSupportedProblem('invalid')).toBe(false);
      expect(isSupportedProblem('goldbach')).toBe(false);
    });
  });

  describe('generateTaskForProblem', () => {
    it('generates tasks for each supported problem', () => {
      for (const problem of SUPPORTED_PROBLEMS) {
        const task = generateTaskForProblem(problem);
        expect(task.problem).toBe(problem);
      }
    });

    it('throws for unsupported problems', () => {
      expect(() =>
        generateTaskForProblem('invalid' as any)
      ).toThrow('Unsupported problem');
    });
  });

  describe('generateRandomTask', () => {
    it('generates tasks from various problems', () => {
      const problems = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const task = generateRandomTask();
        problems.add(task.problem);
      }
      // Should generate tasks for at least 2 different problems
      expect(problems.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('generateTasks', () => {
    it('generates the requested number of tasks', () => {
      const tasks = generateTasks({ count: 5 });
      expect(tasks.length).toBe(5);
    });

    it('generates tasks for specific problem', () => {
      const tasks = generateTasks({ problem: 'collatz', count: 3 });
      expect(tasks.length).toBe(3);
      tasks.forEach(task => {
        expect(task.problem).toBe('collatz');
      });
    });

    it('generates tasks with specific type', () => {
      const tasks = generateTasks({ type: 'COMPUTE', count: 5 });
      expect(tasks.length).toBe(5);
      tasks.forEach(task => {
        expect(task.type).toBe('COMPUTE');
      });
    });

    it('avoids duplicates', () => {
      const tasks = generateTasks({ problem: 'sidon', type: 'VERIFY', count: 10 });
      const paramKeys = tasks.map(t => JSON.stringify(t.parameters));
      const uniqueKeys = new Set(paramKeys);
      expect(uniqueKeys.size).toBe(tasks.length);
    });
  });

  describe('generateBalancedTasks', () => {
    it('generates tasks from all problems', () => {
      const tasks = generateBalancedTasks(9);
      const problems = new Set(tasks.map(t => t.problem));
      expect(problems.size).toBe(3);
    });
  });

  describe('generateDifficultyBalancedTasks', () => {
    it('generates tasks with various difficulties', () => {
      const tasks = generateDifficultyBalancedTasks(9);
      const difficulties = new Set(tasks.map(t => t.difficulty));
      expect(difficulties.size).toBeGreaterThanOrEqual(2);
    });
  });
});
