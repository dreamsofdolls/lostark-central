"use client";

import { useEffect, useRef, useState } from "react";
import { CLASS_OPTIONS, normalizeClassName } from "@/lib/lostark/classes";
import { ClassIcon } from "@/components/Icon";

type ClassDropdownProps = {
  value: string;
  onChange: (nextClass: string) => void;
  className?: string;
};

export function ClassDropdown({ value, onChange, className }: ClassDropdownProps) {
  const normalized = normalizeClassName(value);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${className ?? ""} flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 transition hover:border-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30`.trim()}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ClassIcon className={normalized} size="sm" />
          <span className="truncate">{normalized}</span>
        </div>
        <span className={`shrink-0 text-xs text-zinc-400 transition ${isOpen ? "rotate-180" : ""}`}>⌄</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg">
          <div className="max-h-64 overflow-y-auto">
            {CLASS_OPTIONS.map((classOption) => (
              <button
                key={classOption}
                type="button"
                onClick={() => {
                  onChange(classOption);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                  normalized === classOption
                    ? "bg-blue-600 text-white"
                    : "text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                <ClassIcon className={classOption} size="sm" />
                <span className="flex-1">{classOption}</span>
                {normalized === classOption && (
                  <span className="text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
