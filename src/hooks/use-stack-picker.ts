'use client';

import { useState, useMemo, useRef, useCallback, KeyboardEvent } from 'react';
import { AVAILABLE_STACKS, POPULAR_STACKS } from '@/config/project';

const MAX_STACK = 15;

interface UseStackPickerProps {
  selected:  string[];
  onChange:  (stacks: string[]) => void;
}

export function useStackPicker({ selected, onChange }: UseStackPickerProps) {
  const [query, setQuery]   = useState('');
  const inputRef            = useRef<HTMLInputElement>(null);

  // Suggestions: filter full list by query, exclude already-selected
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return AVAILABLE_STACKS
      .filter((s) => s.toLowerCase().includes(q) && !selected.includes(s))
      .slice(0, 8);
  }, [query, selected]);

  // Whether the exact custom value is addable (not in list, not already selected)
  const canAddCustom = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return false;
    const exactInList = AVAILABLE_STACKS.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );
    return !exactInList && !selected.includes(trimmed);
  }, [query, selected]);

  const add = useCallback((tech: string) => {
    if (selected.length >= MAX_STACK) return;
    if (selected.includes(tech)) return;
    onChange([...selected, tech]);
    setQuery('');
    inputRef.current?.focus();
  }, [selected, onChange]);

  const remove = useCallback((tech: string) => {
    onChange(selected.filter((s) => s !== tech));
  }, [selected, onChange]);

  const toggle = useCallback((tech: string) => {
    if (selected.includes(tech)) {
      remove(tech);
    } else {
      add(tech);
    }
  }, [selected, add, remove]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      // If there's an exact match in suggestions, pick first
      if (suggestions.length > 0) {
        add(suggestions[0]);
      } else if (canAddCustom) {
        add(trimmed); // add as custom
      }
    }
    if (e.key === 'Backspace' && !query && selected.length > 0) {
      remove(selected[selected.length - 1]);
    }
  }, [query, suggestions, canAddCustom, add, remove]);

  return {
    query,
    setQuery,
    inputRef,
    suggestions,
    canAddCustom,
    add,
    remove,
    toggle,
    handleKeyDown,
    reachedMax: selected.length >= MAX_STACK,
    MAX_STACK,
  };
}
