import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Document, Project, Tag } from "@shared/schema";
import { Plus, FileText, Search, Trash2, MoreHorizontal, FlaskConical, Star, Copy, Sun, Moon, FolderOpen, TagIcon, Settings, ChevronRight, ChevronDown } from "lucide-react";
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
import { ProjectManager } from "./project-manager";
import { TagManager } from "./tag-manager";

export function DocSidebar() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [projectManagerOpen, setProjectManagerOpen] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  const docIds = useMemo(() => documents.map(d => d.id).join(","), [documents]);

  const { data: docTagsMap = {} } = useQuery<Record<string, Tag[]>>({
    queryKey: ["/api/documents/tags/batch", docIds],
    queryFn: async () => {
      if (!docIds) return {};
      const res = await fetch(`/api/documents/tags/batch?ids=${docIds}`);
      return res.json();
    },
    enabled: documents.length > 0,
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
    let docs = documents;
    if (searchQuery) {
      docs = docs.filter((d) =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (selectedTagId) {
      docs = docs.filter((d) => {
        const tags = docTagsMap[d.id] || [];
        return tags.some(t => t.id === selectedTagId);
      });
    }
    return docs;
  }, [documents, searchQuery, selectedTagId, docTagsMap]);

  const favoriteDocs = useMemo(() =>
    filteredDocs.filter((d) => d.isFavorite),
    [filteredDocs],
  );

  const docsByProject = useMemo(() => {
    const nonFav = filteredDocs.filter(d => !d.isFavorite);
    const map: Record<string, Document[]> = {};
    for (const p of projects) map[p.id] = [];
    map["_unassigned"] = [];
    for (const doc of nonFav) {
      if (doc.projectId && map[doc.projectId]) {
        map[doc.projectId].push(doc);
      } else {
        map["_unassigned"].push(doc);
      }
    }
    return map;
  }, [filteredDocs, projects]);

  const activeDocId = location.startsWith("/doc/") ? location.split("/doc/")[1] : null;

  const hasProjects = projects.length > 0;

  return (
    <>
      <div className="w-[260px] h-full flex flex-col border-r border-border bg-[#FBFBFA] dark:bg-[#191919] shrink-0" data-testid="doc-sidebar">
        <div className="p-3 pb-2">
          <div className="flex items-center gap-2 px-2 mb-3">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer rounded-md transition-colors duration-150 hover-elevate"
              data-testid="button-home"
              title="Go to dashboard"
            >
              <FlaskConical className="w-5 h-5 text-[#2EAADC] shrink-0" />
              <span className="text-sm font-semibold text-foreground tracking-tight">SciNote</span>
            </button>
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
                    tags={docTagsMap[doc.id]}
                    onNavigate={() => setLocation(`/doc/${doc.id}`)}
                    onDelete={() => deleteMutation.mutate(doc.id)}
                    onDuplicate={() => duplicateMutation.mutate(doc.id)}
                    onToggleFavorite={() => favoriteMutation.mutate(doc.id)}
                  />
                ))}
              </div>
            </>
          )}

          {hasProjects && (
            <>
              <button
                onClick={() => setProjectsExpanded(!projectsExpanded)}
                className="flex items-center gap-1 w-full px-2 py-1.5 mb-0.5"
                data-testid="button-toggle-projects"
              >
                {projectsExpanded ? (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                )}
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projects</span>
              </button>
              {projectsExpanded && (
                <div className="mb-3">
                  {projects.map((project) => {
                    const projectDocs = docsByProject[project.id] || [];
                    if (projectDocs.length === 0) return null;
                    return (
                      <div key={project.id} className="mb-1">
                        <div className="flex items-center gap-1.5 px-2 py-1">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                          <span className="text-[11px] font-medium text-muted-foreground truncate">{project.name}</span>
                          <span className="text-[10px] text-muted-foreground/40 ml-auto">{projectDocs.length}</span>
                        </div>
                        <div className="space-y-0.5 ml-1">
                          {projectDocs.map((doc) => (
                            <DocItem
                              key={doc.id}
                              doc={doc}
                              isActive={activeDocId === doc.id}
                              tags={docTagsMap[doc.id]}
                              onNavigate={() => setLocation(`/doc/${doc.id}`)}
                              onDelete={() => deleteMutation.mutate(doc.id)}
                              onDuplicate={() => duplicateMutation.mutate(doc.id)}
                              onToggleFavorite={() => favoriteMutation.mutate(doc.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
          ) : (docsByProject["_unassigned"] || []).length === 0 && favoriteDocs.length === 0 && !hasProjects ? (
            <div className="px-2 py-8 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground/60">
                {searchQuery ? "No matching documents" : "No documents yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {(docsByProject["_unassigned"] || []).map((doc) => (
                <DocItem
                  key={doc.id}
                  doc={doc}
                  isActive={activeDocId === doc.id}
                  tags={docTagsMap[doc.id]}
                  onNavigate={() => setLocation(`/doc/${doc.id}`)}
                  onDelete={() => deleteMutation.mutate(doc.id)}
                  onDuplicate={() => duplicateMutation.mutate(doc.id)}
                  onToggleFavorite={() => favoriteMutation.mutate(doc.id)}
                />
              ))}
            </div>
          )}

          {allTags.length > 0 && (
            <div className="mt-4 mb-2">
              <div className="flex items-center px-2 py-1.5 mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</span>
              </div>
              <div className="flex flex-wrap gap-1 px-2">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
                    className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                      selectedTagId === tag.id ? "ring-1 ring-primary" : ""
                    }`}
                    style={{
                      backgroundColor: tag.color + "18",
                      color: tag.color,
                    }}
                    data-testid={`sidebar-tag-${tag.id}`}
                  >
                    {tag.name}
                  </button>
                ))}
                {selectedTagId && (
                  <button
                    onClick={() => setSelectedTagId(null)}
                    className="text-[10px] px-1.5 py-0.5 rounded-full text-muted-foreground bg-muted/50"
                    data-testid="button-clear-tag-filter"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border/50 space-y-1">
          <div className="flex gap-1">
            <button
              onClick={() => setProjectManagerOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs text-muted-foreground/60 transition-colors duration-150 hover-elevate"
              data-testid="button-manage-projects"
              title="Manage projects"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Projects
            </button>
            <button
              onClick={() => setTagManagerOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs text-muted-foreground/60 transition-colors duration-150 hover-elevate"
              data-testid="button-manage-tags"
              title="Manage tags"
            >
              <TagIcon className="w-3.5 h-3.5" />
              Tags
            </button>
          </div>
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
      <ProjectManager isOpen={projectManagerOpen} onClose={() => setProjectManagerOpen(false)} />
      <TagManager isOpen={tagManagerOpen} onClose={() => setTagManagerOpen(false)} />
    </>
  );
}

function DocItem({
  doc,
  isActive,
  tags,
  onNavigate,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}: {
  doc: Document;
  isActive: boolean;
  tags?: Tag[];
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
      <div className="flex-1 min-w-0">
        <span className="text-sm truncate block">{doc.title || "Untitled"}</span>
        {tags && tags.length > 0 && (
          <div className="flex gap-0.5 mt-0.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
                title={tag.name}
              />
            ))}
          </div>
        )}
      </div>
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
