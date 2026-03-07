import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Document, Block } from "@shared/schema";
import { Search, FileText, X } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  const { data: results = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents/search", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const res = await fetch(`/api/documents/search?q=${encodeURIComponent(query.trim())}`);
      return res.json();
    },
    enabled: isOpen && query.trim().length > 0,
  });

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const navigateToDoc = useCallback(
    (doc: Document) => {
      setLocation(`/doc/${doc.id}`);
      onClose();
    },
    [setLocation, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        navigateToDoc(results[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [results, selectedIndex, navigateToDoc, onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function getContentPreview(doc: Document): string {
    const blocks = (doc.blocks as Block[]) || [];
    const textContent = blocks
      .filter((b) => b.type !== "divider")
      .map((b) => b.content.replace(/<[^>]*>/g, ""))
      .join(" ")
      .trim();
    return textContent.substring(0, 120) || "Empty document";
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="search-modal-overlay"
    >
      <div
        className="w-full max-w-[560px] bg-popover border border-popover-border rounded-xl shadow-2xl overflow-hidden"
        data-testid="search-modal"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documents..."
            className="flex-1 bg-transparent outline-none text-foreground text-base placeholder:text-muted-foreground/50"
            data-testid="input-search-modal"
          />
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground transition-colors hover-elevate"
            data-testid="button-close-search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {query.trim() && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No documents found</p>
            </div>
          )}
          {!query.trim() && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground/60">Type to search across all documents</p>
            </div>
          )}
          {results.map((doc, i) => (
            <button
              key={doc.id}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-100 ${
                i === selectedIndex ? "bg-accent" : ""
              }`}
              onClick={() => navigateToDoc(doc)}
              onMouseEnter={() => setSelectedIndex(i)}
              data-testid={`search-result-${doc.id}`}
            >
              <span className="text-base mt-0.5 shrink-0">{doc.icon || "📄"}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{doc.title || "Untitled"}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{getContentPreview(doc)}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground/50">
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd> Navigate</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">↵</kbd> Open</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
