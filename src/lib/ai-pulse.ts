export const ghFetch = (path: string) =>
  fetch(`https://api.github.com${path}`, {
    headers: {
      'User-Agent': 'Code-Afterlife-AI-Cron',
      Accept: 'application/vnd.github+json',
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }),
    },
    next: { revalidate: 0 },
  });

export function calcHealthFromCommits(commitCount: number, currentHealth: number): number {
  const commitScore = Math.min(100, (commitCount / 10) * 100);
  return Math.round(commitScore * 0.6 + currentHealth * 0.4);
}

export async function generatePulse(
  projectTitle: string,
  commitMessages: string[],
  readme: string | null,
  isResurrection: boolean
): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) return null;

  const context = [
    `Project: "${projectTitle}"`,
    readme ? `\nREADME excerpt:\n${readme.slice(0, 800)}` : '',
    `\nRecent commits:\n- ${commitMessages.slice(0, 12).join('\n- ')}`,
  ].join('');

  const systemPrompt = isResurrection
    ? `You are a cinematic narrator for Code Afterlife — a platform where dead software projects come back to life.
A project that was DEAD has just received new commits from its original author. Write a single, emotionally charged paragraph (max 2 sentences) marking its resurrection.
Tone: Atmospheric, hopeful, poetic. Like a ghost stirring back to life. Do NOT use corporate speak or bullet points.
Example: "Against all odds, the creator returned. The terminal hummed to life again — a quiet promise that the work was not yet finished."`
    : `You are a cinematic observer charting the progress of a software project on Code Afterlife.
Read the commits and README excerpt, then write a single short paragraph (max 2 sentences) summarizing what the developer accomplished.
Tone: Atmospheric, observant, slightly poetic — like a narrator watching a creator at work. Do NOT sound like a robot.
Example: "The creator pushed deep into the night, stabilizing the core engine and sealing a long-standing memory leak."`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: context },
        ],
        max_tokens: 120,
        temperature: 0.82,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
