import { notFound } from 'next/navigation';
import { projectService } from '@/services/project.service';
import { lineageService } from '@/services/lineage.service';
import { LineageGraph } from '@/components/lineage/LineageGraph';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await projectService.getBySlug(slug);
  if (!project) return { title: 'Lineage Not Found | Code Afterlife' };
  return {
    title: `Lineage: ${project.title} | Code Afterlife`,
    description: `Resurrection lineage tree for ${project.title}.`,
  };
}

// lineage graph page
export default async function LineagePage({ params }: PageProps) {
  const { slug } = await params;
  const project = await projectService.getBySlug(slug);

  if (!project) notFound();

  const tree = await lineageService.getLineageTree(project.id);
  const { nodes, edges } = lineageService.buildReactFlowGraph(tree);

  return (
    <div className="relative h-screen w-full bg-[#050505] overflow-hidden">
      {/* Absolute Cinematic Header */}
      <div className="pointer-events-none absolute left-0 top-0 z-50 w-full bg-linear-to-b from-black/80 to-transparent pt-12 pb-24 px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-500/70 mb-2">
          Project Lineage
        </p>
        <h1 className="font-mono text-3xl font-bold tracking-tight text-foreground/90">
          {project.title}
        </h1>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
          {nodes.length} project{nodes.length !== 1 ? 's' : ''} in this resurrection chain
        </p>
        
        <div className="mt-6 pointer-events-auto">
          <a href={`/project/${project.slug}`} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/20 transition-colors">
            ← Back to Project
          </a>
        </div>
      </div>

      {/* Full screen Graph */}
      <div className="absolute inset-0">
        <LineageGraph nodes={nodes} edges={edges} />
      </div>
    </div>
  );
}
