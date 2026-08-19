import { NextRequest } from 'next/server';
import { ApiError } from '@/lib/api-error';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler, type RouteContext } from '@/lib/async-handler';
import { requireAuth } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';
import { projectService } from '@/services/project.service';
import { updateStateSchema } from '@/schemas/project.schema';
import type { ProjectState } from '@prisma/client';


async function generateDeathReason(
  title: string,
  description: string | null,
  stack: string[],
): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) return null;

  const context = [
    `Project: "${title}"`,
    description ? `\nDescription: ${description.slice(0, 300)}` : '',
    stack.length ? `\nStack: ${stack.join(', ')}` : '',
  ].join('');

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: `You are the epitaph writer for Code Afterlife, a graveyard for dead software projects.
Given a project, write a single short, poetic sentence (max 12 words) explaining why it died or was abandoned.
Tone: cinematic, wistful, slightly dark - like a tombstone inscription.
Examples: "Lost to scope creep and sleepless nights." | "The rewrite never came." | "One push notification away from launch." | "Burned out before the first user arrived."
Return ONLY the sentence. No quotes. No punctuation after the period. No explanation.`,
          },
          { role: 'user', content: context },
        ],
        max_tokens: 30,
        temperature: 0.9,
      }),
    });

    if (!res.ok) {
      logger.error('Groq death reason generation failed', {
        status: res.status,
        statusText: res.statusText,
      });
      return null;
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? null;
    return raw ? raw.replace(/^["']|["']$/g, '').slice(0, 120) : null;
  } catch (error) {
    logger.error('Groq death reason generation threw', { error });
    return null;
  }
}


export const PATCH = asyncHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { id } = await context!.params;
    const user = await requireAuth();
    const body = await request.json();
    const validated = updateStateSchema.parse(body);
    const newState = validated.state as ProjectState;

    const existing = await projectService.getById(id);
    if (!existing) throw ApiError.notFound('Project not found');
    if (existing.userId !== user.id) throw ApiError.forbidden('You do not own this project');

    let deathReason: string | undefined;
    if (newState === 'DEAD') {
      const aiReason = await generateDeathReason(
        existing.title,
        existing.description ?? null,
        existing.stack,
      );
      deathReason = aiReason ?? 'Lost to time.';
    }

    const updated = await projectService.updateState(id, newState, {
      source: 'manual',
      deathReason,
    });

    return apiResponse.success(updated, `State changed to ${newState}`);
  }
);
