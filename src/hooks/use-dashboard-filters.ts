'use client';

import { useState, useMemo } from 'react';
import type { Project, ProjectState } from '@prisma/client';


export type DashboardFilter = 'ALL' | 'BORN' | 'ACTIVE' | 'STALLED' | 'SHIPPED' | 'DEAD';
export type DashboardSort   = 'HEALTH_DESC' | 'HEALTH_ASC' | 'NEWEST' | 'OLDEST' | 'TRENDING';

export function useDashboardFilters(initialProjects: Project[]) {
  const [filter, setFilter] = useState<DashboardFilter>('ALL');
  const [sort, setSort]     = useState<DashboardSort>('HEALTH_DESC');

  const filteredProjects = useMemo(() => {
    if (filter === 'ALL') return initialProjects;
    return initialProjects.filter((p) => p.state === filter as ProjectState);
  }, [initialProjects, filter]);

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      switch (sort) {
        case 'HEALTH_DESC':
          return b.health - a.health;
        case 'HEALTH_ASC':
          return a.health - b.health;
        case 'NEWEST':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'OLDEST':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'TRENDING':
          return (b.trendingScore ?? 0) - (a.trendingScore ?? 0);
        default:
          return 0;
      }
    });
  }, [filteredProjects, sort]);

  return {
    filter,
    setFilter,
    sort,
    setSort,
    projects: sortedProjects,
  };
}
