import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Document } from "@shared/schema";
import { Plus, FileText, Search, Trash2, MoreHorizontal, FlaskConical, Star, Copy, Sun, Moon } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SearchModal } from "./search-modal";
import { useTheme } from "./theme-provider";

export function DocSidebar() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const createMutation = useMutation({
    mutationFn: async (data?: { title: string; blocks: any[] }) => {
      const res = await apiRequest("POST", "/api/documents", data || {
        title: "Untitled",
        blocks: [{ id: Math.random().toString(36).substr(2, 9), type: "text", content: "" }],
      });
      return res.json();
    },
    onSuccess: (doc: Document) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setLocation(`/doc/${doc.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      if (location.startsWith("/doc/")) {
        setLocation("/");
      }
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/documents/${id}/duplicate`);
      return res.json();
    },
    onSuccess: (doc: Document) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setLocation(`/doc/${doc.id}`);
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/documents/${id}/favorite`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const filteredDocs = useMemo(() => {
    if (!searchQuery) return documents;
    return documents.filter((d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [documents, searchQuery]);

  const favoriteDocs = useMemo(() =>
    filteredDocs.filter((d) => d.isFavorite),
    [filteredDocs],
  );

  const regularDocs = useMemo(() =>
    filteredDocs.filter((d) => !d.isFavorite),
    [filteredDocs],
  );

  const activeDocId = location.startsWith("/doc/") ? location.split("/doc/")[1] : null;

  return (
    <>
      <div className="w-[260px] h-full flex flex-col border-r border-border bg-[#FBFBFA] dark:bg-[#191919] shrink-0" data-testid="doc-sidebar">
        <div className="p-3 pb-2">
          <div className="flex items-center gap-2 px-2 mb-3">
            <FlaskConical className="w-5 h-5 text-[#2EAADC]" />
            <span className="text-sm font-semibold text-foreground tracking-tight flex-1">SciNote</span>
            <button
              onClick={toggleTheme}
              className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/60 transition-colors duration-150 hover-elevate"
              data-testid="button-theme-toggle"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center gap-2 h-8 px-2.5 text-sm bg-background/60 border border-transparent rounded-md text-muted-foreground/50 transition-colors cursor-pointer hover-elevate"
            data-testid="button-open-search"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="text-[10px] text-muted-foreground/40 bg-muted px-1 py-0.5 rounded">Ctrl+P</kbd>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {favoriteDocs.length > 0 && (
            <>
              <div className="flex items-center px-2 py-1.5 mb-0.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Favorites</span>
              </div>
              <div className="space-y-0.5 mb-3">
                {favoriteDocs.map((doc) => (
                  <DocItem
                    key={doc.id}
                    doc={doc}
                    isActive={activeDocId === doc.id}
                    onNavigate={() => setLocation(`/doc/${doc.id}`)}
                    onDelete={() => deleteMutation.mutate(doc.id)}
                    onDuplicate={() => duplicateMutation.mutate(doc.id)}
                    onToggleFavorite={() => favoriteMutation.mutate(doc.id)}
                  />
                ))}
              </div>
            </>
          )}

          <div className="flex items-center justify-between px-2 py-1.5 mb-0.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Documents</span>
            <button
              onClick={() => createMutation.mutate()}
              className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground/60 transition-colors duration-150 hover-elevate"
              data-testid="button-new-doc"
              title="New document"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="px-2 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 rounded-md bg-muted/40 mb-1 animate-pulse" />
              ))}
            </div>
          ) : regularDocs.length === 0 && favoriteDocs.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground/60">
                {searchQuery ? "No matching documents" : "No documents yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {regularDocs.map((doc) => (
                <DocItem
                  key={doc.id}
                  doc={doc}
                  isActive={activeDocId === doc.id}
                  onNavigate={() => setLocation(`/doc/${doc.id}`)}
                  onDelete={() => deleteMutation.mutate(doc.id)}
                  onDuplicate={() => duplicateMutation.mutate(doc.id)}
                  onToggleFavorite={() => favoriteMutation.mutate(doc.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border/50">
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-md bg-foreground/5 text-sm text-foreground/70 transition-colors duration-150 hover-elevate"
            data-testid="button-new-doc-bottom"
          >
            <Plus className="w-4 h-4" />
            New Page
          </button>
        </div>
      </div>

      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
}

function DocItem({
  doc,
  isActive,
  onNavigate,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}: {
  doc: Document;
  isActive: boolean;
  onNavigate: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors duration-100 ${
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-foreground/80"
      } hover-elevate`}
      onClick={onNavigate}
      data-testid={`doc-item-${doc.id}`}
    >
      <span className="text-base shrink-0">{doc.icon || "📄"}</span>
      <span className="text-sm truncate flex-1">{doc.title || "Untitled"}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
            data-testid={`button-doc-menu-${doc.id}`}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            data-testid={`button-favorite-${doc.id}`}
          >
            <Star className={`w-4 h-4 mr-2 ${doc.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
            {doc.isFavorite ? "Unfavorite" : "Favorite"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            data-testid={`button-duplicate-${doc.id}`}
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-destructive"
            data-testid={`button-delete-doc-${doc.id}`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
