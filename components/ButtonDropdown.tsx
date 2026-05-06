"use client";

import { useEffect, useRef, useState } from "react";

export type ButtonDropdownOption = {
  value: string;
  label: string;
};

type ButtonDropdownProps = {
  value: string;
  options: ButtonDropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function ButtonDropdown({ value, options, onChange, placeholder, className }: ButtonDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (!isOpen) {
      return;
    }
    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`.trim()}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition hover:border-zinc-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={`truncate ${selected ? "text-zinc-100" : "text-zinc-400"}`}>
          {selected?.label ?? placeholder ?? "Select"}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-zinc-400 transition ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`block w-full px-3 py-2 text-left text-sm transition ${
                option.value === value ? "bg-blue-600 text-white" : "text-zinc-100 hover:bg-zinc-800"
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
