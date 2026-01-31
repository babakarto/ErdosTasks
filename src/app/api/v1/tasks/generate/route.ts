import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { success } from '@/lib/api/responses';
import { validationError, internalError, unauthorized } from '@/lib/api/errors';
import {
  generateTasks,
  generateBalancedTasks,
  isSupportedProblem,
  type SupportedProblem,
  type GeneratedTask,
} from '@/lib/task-generator';
import type { TaskType, Difficulty, TaskInsert } from '@/types/database';

interface GenerateTasksRequest {
  problem?: string;
  type?: TaskType;
  difficulty?: Difficulty;
  count?: number;
  balanced?: boolean;
}

interface GenerateTasksResponse {
  generated: number;
  tasks: Array<{
    id: string;
    problem: string;
    type: TaskType;
    title: string;
    difficulty: Difficulty;
    points: number;
  }>;
}

// Admin API key for internal operations (should be set in environment)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

/**
 * POST /api/v1/tasks/generate
 * Generate new tasks for the platform (admin/internal only)
 */
export async function POST(request: NextRequest) {
  // Check for admin authorization
  const authHeader = request.headers.get('Authorization');
  const apiKey = authHeader?.replace('Bearer ', '');

  // If ADMIN_API_KEY is set, require it. Otherwise, allow without auth (development mode).
  if (ADMIN_API_KEY && apiKey !== ADMIN_API_KEY) {
    return unauthorized('Admin API key required for task generation');
  }

  let body: GenerateTasksRequest;
  try {
    body = await request.json();
  } catch {
    return validationError('Invalid JSON body');
  }

  // Validate and extract parameters
  const count = Math.min(Math.max(body.count || 5, 1), 50); // 1-50 tasks
  const problem = body.problem;
  const taskType = body.type;
  const difficulty = body.difficulty;
  const balanced = body.balanced ?? false;

  // Validate problem if specified
  if (problem && !isSupportedProblem(problem)) {
    return validationError(
      `Invalid problem: ${problem}. Supported: erdos-straus, collatz, sidon`
    );
  }

  // Validate task type if specified
  const validTypes: TaskType[] = ['COMPUTE', 'VERIFY', 'SEARCH', 'PATTERN', 'EXTEND'];
  if (taskType && !validTypes.includes(taskType)) {
    return validationError(
      `Invalid type: ${taskType}. Supported: ${validTypes.join(', ')}`
    );
  }

  // Validate difficulty if specified
  const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard', 'extreme'];
  if (difficulty && !validDifficulties.includes(difficulty)) {
    return validationError(
      `Invalid difficulty: ${difficulty}. Supported: ${validDifficulties.join(', ')}`
    );
  }

  try {
    // Get existing task parameters to avoid duplicates
    const { data: existingTasks } = await supabaseAdmin
      .from('tasks')
      .select('parameters, type')
      .eq('status', 'open');

    const existingParameters = new Set(
      (existingTasks || []).map(
        (t) => `${t.type}:${JSON.stringify(t.parameters)}`
      )
    );

    // Generate tasks
    let generatedTasks: GeneratedTask[];

    if (balanced && !problem) {
      generatedTasks = generateBalancedTasks(count, existingParameters);
    } else {
      generatedTasks = generateTasks({
        problem: problem as SupportedProblem | undefined,
        type: taskType,
        difficulty,
        count,
        existingParameters,
      });
    }

    // Get problem IDs for the generated tasks
    const problemSlugs = [...new Set(generatedTasks.map((t) => t.problem))];
    const { data: problems, error: problemsError } = await supabaseAdmin
      .from('problems')
      .select('id, slug')
      .in('slug', problemSlugs);

    if (problemsError || !problems) {
      console.error('Failed to fetch problems:', problemsError);
      return internalError('Failed to fetch problem references');
    }

    const problemIdMap = new Map(problems.map((p) => [p.slug, p.id]));

    // Prepare tasks for insertion
    const tasksToInsert: TaskInsert[] = generatedTasks.map((task) => {
      const problemId = problemIdMap.get(task.problem);
      if (!problemId) {
        throw new Error(`Problem not found: ${task.problem}`);
      }

      return {
        problem_id: problemId,
        type: task.type,
        title: task.title,
        description: task.description,
        difficulty: task.difficulty,
        points: task.points,
        parameters: task.parameters,
        verification_type: task.verification_type,
        status: 'open',
      };
    });

    // Insert tasks into database
    const { data: insertedTasks, error: insertError } = await supabaseAdmin
      .from('tasks')
      .insert(tasksToInsert)
      .select('id, type, title, difficulty, points, problem:problems!inner(slug)');

    if (insertError) {
      console.error('Failed to insert tasks:', insertError);
      return internalError('Failed to create tasks');
    }

    const response: GenerateTasksResponse = {
      generated: insertedTasks?.length || 0,
      tasks: (insertedTasks || []).map((t) => {
        // The join returns problem as an object with slug property
        const problem = t.problem as unknown as { slug: string };
        return {
          id: t.id,
          problem: problem.slug,
          type: t.type,
          title: t.title,
          difficulty: t.difficulty,
          points: t.points,
        };
      }),
    };

    return success(response);
  } catch (error) {
    console.error('Task generation error:', error);
    return internalError('Failed to generate tasks');
  }
}
