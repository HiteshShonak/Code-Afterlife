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
  if (!project) return { title: 'Lineage Not Found — Code Afterlife' };
  return {
    title: `Lineage: ${project.title} — Code Afterlife`,
    description: `Resurrection lineage tree for ${project.title}.`,
  };
}

/**
 * Lineage graph page — server component.
 * Fetches the full ancestry tree and passes it to the client-side React Flow graph.
 */
export default async function LineagePage({ params }: PageProps) {
  const { slug } = await params;
  const project = await projectService.getBySlug(slug);

  if (!project) notFound();

  const tree = await lineageService.getLineageTree(project.id);
  const { nodes, edges } = lineageService.buildReactFlowGraph(tree);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-6 md:px-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Lineage Tree
        </p>
        <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight text-foreground">
          {project.title}
        </h1>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          {nodes.length} project{nodes.length !== 1 ? 's' : ''} in this lineage chain
        </p>
      </div>

      {/* Graph — dynamically loaded, SSR false */}
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="h-[600px] overflow-hidden rounded-sm border border-foreground/10">
          <LineageGraph nodes={nodes} edges={edges} />
        </div>
      </div>
    </div>
  );
}
