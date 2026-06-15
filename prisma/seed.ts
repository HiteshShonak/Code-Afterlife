import { PrismaClient, ProjectState } from '@prisma/client';

const prisma = new PrismaClient();

// helpers

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function hoursAgo(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

// seed

async function main() {
  console.log('🌱 Seeding Code Afterlife...\n');

  // users
  // avatar api

  const arjun = await prisma.user.upsert({
    where: { username: 'arjun-sharma-dev' },
    update: {},
    create: {
      name: 'Arjun Sharma',
      email: 'arjun@codeafterlife.io',
      username: 'arjun-sharma-dev',
      githubId: 94_201_883,
      image: 'https://avatars.githubusercontent.com/u/94201883?v=4',
    },
  });

  const priya = await prisma.user.upsert({
    where: { username: 'priya-builds' },
    update: {},
    create: {
      name: 'Priya Nair',
      email: 'priya@codeafterlife.io',
      username: 'priya-builds',
      githubId: 94_201_884,
      image: 'https://avatars.githubusercontent.com/u/94201884?v=4',
    },
  });

  console.log(`  ✅ Users created: ${arjun.username}, ${priya.username}`);

  // projects

  // 1. active
  const devlogger = await prisma.project.upsert({
    where: { slug: 'devlogger' },
    update: {},
    create: {
      userId: arjun.id,
      slug: 'devlogger',
      title: 'DevLogger',
      description:
        'Structured logging dashboard for Node.js microservices. Pulls logs from multiple services into one queryable UI. Built because I was tired of tailing 6 terminal windows simultaneously.',
      githubRepoUrl: 'https://github.com/arjun-sharma-dev/devlogger',
      stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Tailwind'],
      state: ProjectState.ACTIVE,
      health: 82,
      lastActivityAt: daysAgo(3),
      lastHealthUpdate: new Date(),
      lineageDepth: 0,
    },
  });

  // 2. stalled
  const inkframe = await prisma.project.upsert({
    where: { slug: 'inkframe' },
    update: {},
    create: {
      userId: arjun.id,
      slug: 'inkframe',
      title: 'Inkframe',
      description:
        'A minimalist writing tool with focus mode and distraction-free editing. Markdown with live preview, custom themes, local-first storage. Stalled when a new job started and the evenings disappeared.',
      githubRepoUrl: 'https://github.com/arjun-sharma-dev/inkframe',
      stack: ['React', 'Vite', 'TypeScript', 'CodeMirror'],
      state: ProjectState.STALLED,
      health: 28,
      lastActivityAt: daysAgo(47),
      lastHealthUpdate: new Date(),
      lineageDepth: 0,
    },
  });

  // 3. shipped
  const formflux = await prisma.project.upsert({
    where: { slug: 'formflux' },
    update: {},
    create: {
      userId: arjun.id,
      slug: 'formflux',
      title: 'FormFlux',
      description:
        'Open-source form builder with drag-and-drop fields, conditional logic, and webhook delivery. Used in production by 3 small companies. Shipped after 11 weeks of weekend work.',
      githubRepoUrl: 'https://github.com/arjun-sharma-dev/formflux',
      stack: ['React', 'Node.js', 'MongoDB', 'Express'],
      state: ProjectState.SHIPPED,
      health: 91,
      lastActivityAt: daysAgo(14),
      lastHealthUpdate: new Date(),
      lineageDepth: 0,
    },
  });

  // 4. dead original
  const channelpilot = await prisma.project.upsert({
    where: { slug: 'channelpilot' },
    update: {},
    create: {
      userId: arjun.id,
      slug: 'channelpilot',
      title: 'ChannelPilot',
      description:
        'Multi-channel notification system — email, Slack, SMS, and push from one API. Built the core routing engine and three adapters before burning out on the sheer scope of it. The architecture is solid. The will wasn\'t.',
      githubRepoUrl: 'https://github.com/arjun-sharma-dev/channelpilot',
      stack: ['Python', 'FastAPI', 'Redis', 'PostgreSQL', 'Celery'],
      state: ProjectState.DEAD,
      health: 4,
      lastActivityAt: daysAgo(118),
      lastHealthUpdate: new Date(),
      lineageDepth: 0,
    },
  });

  // 5. dead second
  const mapvault = await prisma.project.upsert({
    where: { slug: 'mapvault' },
    update: {},
    create: {
      userId: priya.id,
      slug: 'mapvault',
      title: 'MapVault',
      description:
        'Personal geography tracking app. Log places you\'ve visited, annotate memories, visualize your travel history on an interactive globe. Shelved after Mapbox pricing changed mid-build.',
      githubRepoUrl: 'https://github.com/priya-builds/mapvault',
      stack: ['Svelte', 'SvelteKit', 'TypeScript', 'Mapbox', 'Supabase'],
      state: ProjectState.DEAD,
      health: 7,
      lastActivityAt: daysAgo(203),
      lastHealthUpdate: new Date(),
      lineageDepth: 0,
    },
  });

  // 6. born new
  const patchwork = await prisma.project.upsert({
    where: { slug: 'patchwork-ui' },
    update: {},
    create: {
      userId: priya.id,
      slug: 'patchwork-ui',
      title: 'Patchwork UI',
      description:
        'Component library built on top of Radix primitives with a focus on data-dense interfaces. Dark mode first. Designed for apps that show a lot of information without feeling cluttered.',
      githubRepoUrl: 'https://github.com/priya-builds/patchwork-ui',
      stack: ['React', 'TypeScript', 'Radix UI', 'Tailwind', 'Storybook'],
      state: ProjectState.BORN,
      health: 50,
      lastActivityAt: hoursAgo(6),
      lastHealthUpdate: new Date(),
      lineageDepth: 0,
    },
  });

  // 7. active resurrected
  const notifyflow = await prisma.project.upsert({
    where: { slug: 'notifyflow' },
    update: {},
    create: {
      userId: priya.id,
      slug: 'notifyflow',
      title: 'NotifyFlow',
      description:
        'ChannelPilot rebuilt with a narrower scope: just email and webhooks, done properly. Stripped out everything Arjun couldn\'t finish and replaced the Celery queue with a clean BullMQ setup. The bones were good — just needed a second pair of hands.',
      githubRepoUrl: 'https://github.com/priya-builds/notifyflow',
      stack: ['TypeScript', 'Node.js', 'BullMQ', 'PostgreSQL', 'Resend'],
      state: ProjectState.ACTIVE,
      health: 67,
      parentProjectId: channelpilot.id,
      resurrecterUserId: priya.id,
      resurrectionDate: daysAgo(38),
      lineageDepth: 1,
      lastActivityAt: daysAgo(6),
      lastHealthUpdate: new Date(),
    },
  });

  console.log(`  ✅ Projects: ${[devlogger, inkframe, formflux, channelpilot, mapvault, patchwork, notifyflow].map(p => p.title).join(', ')}`);

  // timeline entries
  // tell a story

  const timelineEntries = [
    // devlogger active
    {
      id: 'tl-devlogger-1',
      projectId: devlogger.id,
      type: 'UPDATE' as const,
      title: 'First working prototype',
      description: 'Log ingestion and basic query interface working end-to-end. Not pretty but it runs.',
      createdAt: daysAgo(61),
    },
    {
      id: 'tl-devlogger-2',
      projectId: devlogger.id,
      type: 'MILESTONE' as const,
      title: 'Real-time log streaming added',
      description: 'Server-sent events for live log tail. First time I\'ve done SSE properly — much simpler than I expected.',
      createdAt: daysAgo(22),
    },
    {
      id: 'tl-devlogger-3',
      projectId: devlogger.id,
      type: 'UPDATE' as const,
      title: 'Query filter and time range UI shipped',
      description: 'Date picker, level filter, service filter. Dashboard actually feels useful now.',
      createdAt: daysAgo(3),
    },

    // inkframe stalled
    {
      id: 'tl-inkframe-1',
      projectId: inkframe.id,
      type: 'UPDATE' as const,
      title: 'Core editor working',
      description: 'CodeMirror integrated, markdown preview rendering. Focus mode hides everything except the words.',
      createdAt: daysAgo(89),
    },
    {
      id: 'tl-inkframe-2',
      projectId: inkframe.id,
      type: 'MILESTONE' as const,
      title: 'Custom theme engine complete',
      description: 'Five built-in themes. CSS variables, hot-swap without reload. My favourite part of this codebase.',
      createdAt: daysAgo(71),
    },
    {
      id: 'tl-inkframe-3',
      projectId: inkframe.id,
      type: 'UPDATE' as const,
      title: 'Last commit before the silence',
      description: 'Fixed a cursor positioning bug in the vim keybinding mode. Started new job the next day. Haven\'t touched it since.',
      createdAt: daysAgo(47),
    },

    // formflux success
    {
      id: 'tl-formflux-1',
      projectId: formflux.id,
      type: 'MILESTONE' as const,
      title: 'Drag-and-drop working',
      description: 'First time building a real DnD interface from scratch. Took two weekends but got there.',
      createdAt: daysAgo(112),
    },
    {
      id: 'tl-formflux-2',
      projectId: formflux.id,
      type: 'MILESTONE' as const,
      title: 'First external user',
      description: 'A startup founder found it on Twitter and started using it for their waitlist. Didn\'t break.',
      createdAt: daysAgo(68),
    },
    {
      id: 'tl-formflux-3',
      projectId: formflux.id,
      type: 'MILESTONE' as const,
      title: 'Shipped v1.0',
      description: 'Conditional logic, webhook delivery, export to CSV. 11 weeks from first commit to stable release.',
      createdAt: daysAgo(31),
    },

    // channelpilot death
    {
      id: 'tl-channelpilot-1',
      projectId: channelpilot.id,
      type: 'UPDATE' as const,
      title: 'Core routing engine built',
      description: 'The hardest part done first — message routing with retry logic and dead letter queue. Proud of this.',
      createdAt: daysAgo(281),
    },
    {
      id: 'tl-channelpilot-2',
      projectId: channelpilot.id,
      type: 'UPDATE' as const,
      title: 'Email and Slack adapters complete',
      description: 'Both adapters work, rate limiting is handled. Started SMS integration. That\'s when scope creep hit.',
      createdAt: daysAgo(198),
    },
    {
      id: 'tl-channelpilot-3',
      projectId: channelpilot.id,
      type: 'DEATH' as const,
      title: 'Project abandoned',
      description: 'The SMS provider required business verification I couldn\'t get quickly. Motivation collapsed. Left it at 70% done.',
      createdAt: daysAgo(118),
    },
    {
      id: 'tl-channelpilot-res',
      projectId: channelpilot.id,
      type: 'RESURRECTION' as const,
      title: 'Resurrected as NotifyFlow',
      description: 'Priya forked the project, stripped it to email + webhooks, and rebuilt the queue layer. The architecture held up.',
      createdAt: daysAgo(38),
    },

    // mapvault quiet death
    {
      id: 'tl-mapvault-1',
      projectId: mapvault.id,
      type: 'UPDATE' as const,
      title: 'Interactive globe working',
      description: 'Three.js globe with location markers. Looked genuinely beautiful. Added photo annotations.',
      createdAt: daysAgo(298),
    },
    {
      id: 'tl-mapvault-2',
      projectId: mapvault.id,
      type: 'DEATH' as const,
      title: 'Mapbox pricing changed',
      description: 'The free tier I was relying on disappeared in a pricing update. Couldn\'t justify the cost for a personal project. Stopped here.',
      createdAt: daysAgo(203),
    },

    // notifyflow resurrection
    {
      id: 'tl-notifyflow-1',
      projectId: notifyflow.id,
      type: 'RESURRECTION' as const,
      title: 'Forked from ChannelPilot',
      description: 'The routing core was genuinely good. Replaced Celery with BullMQ, ripped out the unfinished adapters, started fresh on email.',
      createdAt: daysAgo(38),
    },
    {
      id: 'tl-notifyflow-2',
      projectId: notifyflow.id,
      type: 'MILESTONE' as const,
      title: 'Email delivery working',
      description: 'Resend integration done. Transactional email with retry, bounce handling, and delivery receipts.',
      createdAt: daysAgo(18),
    },
    {
      id: 'tl-notifyflow-3',
      projectId: notifyflow.id,
      type: 'UPDATE' as const,
      title: 'Webhook adapter shipped',
      description: 'HTTP webhooks with HMAC signing and exponential backoff. The two features ChannelPilot never reached.',
      createdAt: daysAgo(6),
    },
  ];

  for (const entry of timelineEntries) {
    await prisma.timelineEntry.upsert({
      where: { id: entry.id },
      update: {},
      create: entry,
    });
  }

  console.log(`  ✅ Timeline entries: ${timelineEntries.length} entries created`);

  // milestones

  const milestones = [
    { id: 'ms-formflux-deployed', projectId: formflux.id,    type: 'FIRST_DEPLOYMENT' as const, createdAt: daysAgo(80) },
    { id: 'ms-formflux-firstpr',  projectId: formflux.id,    type: 'FIRST_PR'         as const, createdAt: daysAgo(101) },
    { id: 'ms-formflux-shipped',  projectId: formflux.id,    type: 'SHIPPED'          as const, createdAt: daysAgo(31) },
    { id: 'ms-formflux-user1',    projectId: formflux.id,    type: 'FIRST_USER'       as const, createdAt: daysAgo(68) },
    { id: 'ms-channelpilot-died', projectId: channelpilot.id, type: 'DEATH'           as const, createdAt: daysAgo(118) },
    { id: 'ms-channelpilot-res',  projectId: channelpilot.id, type: 'RESURRECTED'     as const, createdAt: daysAgo(38) },
    { id: 'ms-notifyflow-res',    projectId: notifyflow.id,  type: 'RESURRECTED'      as const, createdAt: daysAgo(38) },
    { id: 'ms-notifyflow-dep',    projectId: notifyflow.id,  type: 'FIRST_DEPLOYMENT' as const, createdAt: daysAgo(18) },
    { id: 'ms-mapvault-died',     projectId: mapvault.id,    type: 'DEATH'            as const, createdAt: daysAgo(203) },
    { id: 'ms-inkframe-quit',     projectId: inkframe.id,    type: 'ALMOST_QUIT'      as const, createdAt: daysAgo(47) },
  ];

  for (const milestone of milestones) {
    await prisma.milestone.upsert({
      where: { id: milestone.id },
      update: {},
      create: milestone,
    });
  }

  console.log(`  ✅ Milestones: ${milestones.length} milestones created`);

  console.log('\n🎉 Seed complete.\n');
  console.log('  Users:    2');
  console.log('  Projects: 7  (1 BORN, 2 ACTIVE, 1 STALLED, 1 SHIPPED, 2 DEAD, 1 resurrection chain)');
  console.log('  Timeline: 18 entries');
  console.log('  Lineage:  ChannelPilot → NotifyFlow');
  console.log('\n  Run: npx prisma studio — to inspect the data.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
