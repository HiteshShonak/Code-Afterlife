import React, { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Database, ArrowRight, ExternalLink } from 'lucide-react';
import { Project } from './types';

interface GraveyardSidebarProps {
  project: Project | null;
  onClose: () => void;
  isAuthenticated?: boolean;
  onResurrect?: (projectId: string) => void;
}

export function GraveyardSidebar({ project, onClose, isAuthenticated, onResurrect }: GraveyardSidebarProps) {
  const isHistoryPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Unified close handler that cleans up pushed history entry if present
  const handleClose = useCallback(() => {
    if (isHistoryPushedRef.current) {
      isHistoryPushedRef.current = false;
      if (typeof window !== 'undefined' && window.history.state?.graveyardSidebarOpen) {
        window.history.back();
      }
    }
    onCloseRef.current();
  }, []);

  // Clean up history state when navigating forward to another route
  const handleNavigation = useCallback(() => {
    if (isHistoryPushedRef.current) {
      isHistoryPushedRef.current = false;
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.href);
      }
    }
  }, []);

  useEffect(() => {
    if (!project) {
      if (isHistoryPushedRef.current) {
        isHistoryPushedRef.current = false;
        if (typeof window !== 'undefined' && window.history.state?.graveyardSidebarOpen) {
          window.history.back();
        }
      }
      return;
    }

    // Push history state so mobile back button / swipe back gesture dismisses the modal
    if (!isHistoryPushedRef.current) {
      window.history.pushState({ graveyardSidebarOpen: true }, '');
      isHistoryPushedRef.current = true;
    }

    const onPopState = () => {
      if (isHistoryPushedRef.current) {
        isHistoryPushedRef.current = false;
        onCloseRef.current();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'BrowserBack') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [project, handleClose]);

  return (
    <AnimatePresence>
      {project && (
        <>
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-y-0 right-0 z-50 flex h-full w-full max-w-[420px] flex-col overflow-y-auto border-l border-[#1a233a] bg-[#070a14]/90 p-5 font-sans text-slate-300 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="min-w-0 break-words text-xl font-bold text-white sm:text-2xl">{project.name}</h2>
                  <span className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    project.status === 'RESURRECTED' 
                      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' 
                      : 'border-violet-500/30 text-violet-400 bg-violet-500/10'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </div>
              <button 
                onClick={handleClose}
                aria-label="Close sidebar"
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quote */}
            <div className="italic text-slate-400 text-sm mb-8 border-l-2 border-slate-700 pl-4">
              {project.quote}
            </div>

            {/* Lifespan */}
            <div className="grid grid-cols-2 gap-4 mb-10 pb-8 border-b border-white/5">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Born</div>
                <div className="text-sm text-slate-300">{project.born}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Died</div>
                <div className="text-sm text-slate-300">{project.died}</div>
              </div>
            </div>

            {/* Resurrected By Section (If applicable) */}
            {project.status === 'RESURRECTED' && project.resurrectedBy && (
              <div className="mb-10 pb-8 border-b border-white/5">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-4">Resurrected By</div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                  <img 
                    src={project.resurrectedBy.avatarUrl} 
                    alt={project.resurrectedBy.name} 
                    className="w-10 h-10 rounded-full border border-emerald-900/50"
                  />
                  <div>
                    <div className="text-sm font-medium text-emerald-100">{project.resurrectedBy.handle}</div>
                    <div className="text-xs text-slate-500">{project.resurrectedBy.date}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="space-y-6 grow">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Database size={14} />
                    Time Capsules
                  </div>
                  <div className="text-xs text-slate-400">{project.timeCapsules}</div>
                </div>
                {/* Dynamic List */}
                <div className="space-y-2">
                  {Array.from({ length: project.timeCapsules }).map((_, i) => (
                    <div key={i} className="flex justify-between text-sm py-2 px-3 bg-white/2 hover:bg-white/5 transition-colors rounded cursor-default border border-transparent hover:border-white/10">
                      <span className="text-slate-300">Capsule {i + 1}</span>
                      <span className="text-slate-500">Sealed</span>
                    </div>
                  ))}
                  {project.timeCapsules === 0 && (
                    <div className="text-sm py-2 px-3 text-slate-500 italic">No time capsules found.</div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} />
                    Soul Connections
                  </div>
                  <div className="text-xs text-slate-400">{project.soulConnections}</div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-400">Viewers</span>
                    <span className="text-white font-medium">{project.viewCount}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-400">Voters</span>
                    <span className="text-white font-medium">{project.voteCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            {/* view project link */}
            {project.slug && (
              <Link
                href={`/project/${project.slug}`}
                onClick={handleNavigation}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/4 py-3 transition-colors hover:bg-white/8 hover:border-white/25"
              >
                <ExternalLink size={13} className="text-slate-400" />
                <span className="text-xs uppercase tracking-widest font-medium text-slate-400">View Full Project</span>
              </Link>
            )}

            {project.status !== 'RESURRECTED' ? (
              isAuthenticated ? (
                <button
                  onClick={() => onResurrect?.(project.id)}
                  className="mt-4 w-full py-4 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  <span className="text-xs uppercase tracking-widest font-medium text-emerald-400">↑ Resurrect this Project</span>
                  <ArrowRight size={14} className="text-emerald-400" />
                </button>
              ) : (
                <Link
                  href="/"
                  onClick={handleNavigation}
                  className="mt-4 w-full py-4 border border-white/10 rounded-xl flex items-center justify-center gap-2 bg-white/5 transition-colors hover:bg-white/10 cursor-pointer"
                >
                  <span className="text-xs uppercase tracking-widest font-medium text-slate-400">Sign in to resurrect</span>
                </Link>
              )
            ) : (
              <div className="mt-4 w-full py-4 border border-white/10 rounded-xl flex items-center justify-center gap-2 bg-white/5 opacity-50">
                <span className="text-xs uppercase tracking-widest font-medium text-slate-300">Already resurrected</span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
