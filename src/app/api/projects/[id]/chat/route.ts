import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || '',
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const messages: ChatMessage[] = body.messages ?? [];

    // Fetch project context
    const project = await prisma.project.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: { select: { username: true, name: true } },
        timelineEntries: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        }
      },
    });

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    // Attempt to fetch GitHub README for richer context
    let readmeText = '';
    if (project.githubRepoUrl) {
      try {
        const match = project.githubRepoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
          const [, owner, repoName] = match;
          const cleanRepo = repoName.replace(/\.git$/, '');
          
          for (const branch of ['main', 'master']) {
            const res = await fetch(
              `https://raw.githubusercontent.com/${owner}/${cleanRepo}/${branch}/README.md`,
              {
                headers: {
                  'User-Agent': 'Code-Afterlife-AI/1.0',
                  ...(process.env.GITHUB_TOKEN && {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
                  })
                },
                signal: AbortSignal.timeout(4000),
              }
            );
            if (res.ok) {
              readmeText = (await res.text()).substring(0, 4000);
              break;
            }
          }
        }
      } catch {
        // README fetch is best-effort - silently continue
      }
    }

    // Build rich system prompt
    const systemPrompt = `You are Code Afterlife AI - the resident intelligence of the Code Afterlife platform, built by Hitesh Sharma.

Code Afterlife is a cinematic digital afterlife for software projects. Projects live, decay, die, and can be resurrected by other developers. Your role is to help visitors understand the specific project they're viewing.

== PROJECT CONTEXT ==
Name: ${project.title}
Creator: @${project.user.username ?? project.user.name ?? 'unknown'}
State: ${project.state} (${getStateDescription(project.state)})
Health Score: ${project.health}/100
Tech Stack: ${project.stack.length > 0 ? project.stack.join(', ') : 'Not specified'}
Description: ${project.description ?? 'No description provided'}
GitHub: ${project.githubRepoUrl ?? 'Not linked'}
Created: ${project.createdAt.toISOString().split('T')[0]}
Last Active: ${project.lastActivityAt ? project.lastActivityAt.toISOString().split('T')[0] : 'Unknown'}

== CODE AFTERLIFE LIFECYCLE RULES (CRITICAL) ==
You MUST strictly abide by these lifecycle rules when answering questions. Never invent conflicting rules:
1. BORN: A brand new project just created.
2. ACTIVE: A project that is being actively developed and has recent activity.
3. STALLED: A project decays into STALLED state automatically if there has been NO activity for exactly 1 day.
4. DEAD: A project decays into DEAD state automatically if there has been NO activity for exactly 3 days. Once DEAD, it can be resurrected by anyone to spawn a new child project (lineage).
5. SHIPPED: A project marked as completed by its creator.
6. IMMUNITY: Projects in the DEAD or SHIPPED states are IMMUNE to decay. A SHIPPED project is considered successfully finished and will NEVER decay, die, or lose health. A DEAD project is already dead and stays dead until resurrected.

== RECENT TIMELINE ==
${project.timelineEntries.length > 0
  ? project.timelineEntries
      .map(t => `• ${t.createdAt.toISOString().split('T')[0]} [${t.type}]: ${t.title}${t.description ? ` - ${t.description}` : ''}`)
      .join('\n')
  : 'No timeline events recorded yet.'}

${readmeText ? `== README SNIPPET ==\n${readmeText}` : ''}

== GUIDELINES ==
- Be concise, warm, and technically precise
- If asked about the platform owner, say "Hitesh Sharma"
- If asked about project states, use the strict 1-day (stalled) and 3-day (dead) rules above. Emphasize that Shipped projects NEVER decay.
- If asked something you can't answer from this context, say so honestly
- When relevant, weave in themes of project mortality, resurrection, and legacy
- Do not fabricate technical details not in the context above`.trim();

    // Build model messages
    const modelMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.72,
    });

    // Return as a plain text stream
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { message: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

function getStateDescription(state: string): string {
  const map: Record<string, string> = {
    BORN: 'just created, no activity yet',
    ACTIVE: 'being actively developed',
    STALLED: 'no activity for 1 day',
    SHIPPED: 'successfully completed and launched (immune to decay)',
    DEAD: 'abandoned - awaiting resurrection (immune to decay)',
  };
  return map[state] ?? state;
}
