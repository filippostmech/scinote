import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Document, Project, Tag, Workspace } from "@shared/schema";
import { Plus, FileText, Search, Trash2, MoreHorizontal, FlaskConical, Star, Copy, Sun, Moon, FolderOpen, TagIcon, ChevronRight, ChevronDown, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Layers, Pencil } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
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
import { WorkspaceManager } from "./workspace-manager";

type SidebarSection = "workspaces" | "favorites" | "projects" | "documents" | "tags";

function getStoredCollapsed(): boolean {
  try {
    return localStorage.getItem("sidebar-collapsed") === "true";
  } catch {
    return false;
  }
}

export function DocSidebar() {
  const [location, setLocation] = useLocation();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [projectManagerOpen, setProjectManagerOpen] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [workspaceManagerOpen, setWorkspaceManagerOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(getStoredCollapsed);
  const [expandedSections, setExpandedSections] = useState<Record<SidebarSection, boolean>>({
    workspaces: true,
    favorites: true,
    projects: true,
    documents: true,
    tags: false,
  });
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>({});
  const [expandedWsProjects, setExpandedWsProjects] = useState<Record<string, boolean>>({});
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

  const { data: workspaces = [] } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
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

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/workspaces/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  const renameWorkspaceMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await apiRequest("PATCH", `/api/workspaces/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  const renameProjectMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await apiRequest("PATCH", `/api/projects/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
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

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("sidebar-collapsed", String(next)); } catch {}
  };

  const toggleSection = (section: SidebarSection) => {
    if (collapsed) {
      setCollapsed(false);
      try { localStorage.setItem("sidebar-collapsed", "false"); } catch {}
      setExpandedSections(prev => ({ ...prev, [section]: true }));
    } else {
      setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    }
  };

  const filteredDocs = useMemo(() => {
    let docs = documents;
    if (selectedTagId) {
      docs = docs.filter((d) => {
        const tags = docTagsMap[d.id] || [];
        return tags.some(t => t.id === selectedTagId);
      });
    }
    return docs;
  }, [documents, selectedTagId, docTagsMap]);

  const favoriteDocs = useMemo(() =>
    filteredDocs.filter((d) => d.isFavorite),
    [filteredDocs],
  );

  const allNonFavDocs = useMemo(() =>
    filteredDocs.filter((d) => !d.isFavorite),
    [filteredDocs],
  );

  const docsByProject = useMemo(() => {
    const map: Record<string, Document[]> = {};
    for (const p of projects) map[p.id] = [];
    map["_unassigned"] = [];
    for (const doc of allNonFavDocs) {
      if (doc.projectId && map[doc.projectId]) {
        map[doc.projectId].push(doc);
      } else {
        map["_unassigned"].push(doc);
      }
    }
    return map;
  }, [allNonFavDocs, projects]);

  const workspaceData = useMemo(() => {
    const data: Record<string, { projects: Project[]; docs: Document[] }> = {};
    for (const ws of workspaces) {
      data[ws.id] = {
        projects: projects.filter(p => p.workspaceId === ws.id),
        docs: allNonFavDocs.filter(d => d.workspaceId === ws.id && !d.projectId),
      };
    }
    return data;
  }, [workspaces, projects, allNonFavDocs]);

  const activeDocId = location.startsWith("/doc/") ? location.split("/doc/")[1] : null;
  const isOnDashboard = location === "/";

  const docItemProps = (doc: Document) => ({
    doc,
    isActive: activeDocId === doc.id,
    tags: docTagsMap[doc.id],
    onNavigate: () => setLocation(`/doc/${doc.id}`),
    onDelete: () => deleteMutation.mutate(doc.id),
    onDuplicate: () => duplicateMutation.mutate(doc.id),
    onToggleFavorite: () => favoriteMutation.mutate(doc.id),
  });

  return (
    <>
      <div
        className="h-full flex flex-col border-r border-border bg-[#FBFBFA] dark:bg-[#191919] shrink-0 transition-all duration-200 ease-in-out overflow-hidden"
        style={{ width: collapsed ? 56 : 260 }}
        data-testid="doc-sidebar"
      >
        <div className={`p-2 ${collapsed ? "px-1.5" : "p-3 pb-2"}`}>
          <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-2 px-2 mb-3"}`}>
            <button
              onClick={() => setLocation("/")}
              className={`flex items-center gap-2 cursor-pointer rounded-md transition-colors duration-150 hover-elevate ${collapsed ? "w-9 h-9 justify-center" : "flex-1 min-w-0"}`}
              data-testid="button-home"
              title="Go to dashboard"
            >
              <FlaskConical className="w-5 h-5 text-[#2EAADC] shrink-0" />
              {!collapsed && <span className="text-sm font-semibold text-foreground tracking-tight">SciNote</span>}
            </button>
            <div className={`flex items-center ${collapsed ? "flex-col gap-1" : "gap-1"}`}>
              <button
                onClick={toggleTheme}
                className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground/60 transition-colors duration-150 hover-elevate"
                data-testid="button-theme-toggle"
                title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={toggleCollapsed}
                className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground/60 transition-colors duration-150 hover-elevate"
                data-testid="button-toggle-sidebar"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!collapsed && (
            <button
              onClick={() => setSearchModalOpen(true)}
              className="w-full flex items-center gap-2 h-8 px-2.5 text-sm bg-background/60 border border-transparent rounded-md text-muted-foreground/50 transition-colors cursor-pointer hover-elevate"
              data-testid="button-open-search"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="text-[10px] text-muted-foreground/40 bg-muted px-1 py-0.5 rounded">Ctrl+P</kbd>
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => setSearchModalOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground/50 transition-colors cursor-pointer hover-elevate mx-auto"
              data-testid="button-open-search-collapsed"
              title="Search (Ctrl+P)"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {collapsed ? (
            <div className="flex flex-col items-center gap-1 px-1.5 py-2">
              <SidebarIconButton
                icon={LayoutDashboard}
                label="Dashboard"
                isActive={isOnDashboard}
                onClick={() => setLocation("/")}
                testId="nav-dashboard"
              />
              <SidebarIconButton
                icon={Layers}
                label="Workspaces"
                badge={workspaces.length || undefined}
                onClick={() => toggleSection("workspaces")}
                onPlusClick={() => setWorkspaceManagerOpen(true)}
                testId="nav-workspaces"
              />
              <SidebarIconButton
                icon={Star}
                label="Favorites"
                badge={favoriteDocs.length || undefined}
                onClick={() => toggleSection("favorites")}
                testId="nav-favorites"
              />
              <SidebarIconButton
                icon={FolderOpen}
                label="Projects"
                badge={projects.length || undefined}
                onClick={() => toggleSection("projects")}
                onPlusClick={() => setProjectManagerOpen(true)}
                testId="nav-projects"
              />
              <SidebarIconButton
                icon={FileText}
                label="Documents"
                badge={allNonFavDocs.length || undefined}
                onClick={() => toggleSection("documents")}
                onPlusClick={() => createMutation.mutate()}
                testId="nav-documents"
              />
              <SidebarIconButton
                icon={TagIcon}
                label="Tags"
                badge={allTags.length || undefined}
                onClick={() => toggleSection("tags")}
                onPlusClick={() => setTagManagerOpen(true)}
                testId="nav-tags"
              />
            </div>
          ) : (
            <div className="px-2">
              <NavSection
                icon={LayoutDashboard}
                label="Dashboard"
                isActive={isOnDashboard}
                onClick={() => setLocation("/")}
                testId="nav-dashboard"
              />

              <NavSection
                icon={Layers}
                label="Workspaces"
                count={workspaces.length}
                expanded={expandedSections.workspaces}
                onToggle={() => toggleSection("workspaces")}
                onPlusClick={() => setWorkspaceManagerOpen(true)}
                plusTitle="New workspace"
                testId="nav-workspaces"
              >
                {workspaces.length === 0 ? (
                  <p className="text-xs text-muted-foreground/40 px-2 py-2">No workspaces yet</p>
                ) : (
                  <div className="space-y-0.5">
                    {workspaces.map((ws) => {
                      const wsData = workspaceData[ws.id] || { projects: [], docs: [] };
                      const isExpanded = expandedWorkspaces[ws.id] ?? false;
                      return (
                        <div key={ws.id}>
                          <div
                            className="group flex items-center gap-1.5 px-2 py-1 cursor-pointer rounded-md transition-colors hover-elevate"
                            onClick={() => setExpandedWorkspaces(prev => ({ ...prev, [ws.id]: !prev[ws.id] }))}
                            data-testid={`sidebar-workspace-${ws.id}`}
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground/40 shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                            <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: ws.color }} />
                            <span className="text-xs font-medium text-foreground/80 truncate flex-1">{ws.name}</span>
                            <span className="text-[10px] text-muted-foreground/40">{wsData.projects.length + wsData.docs.length}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`button-workspace-menu-${ws.id}`}
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newName = prompt("Rename workspace:", ws.name);
                                    if (newName && newName.trim() && newName !== ws.name) {
                                      renameWorkspaceMutation.mutate({ id: ws.id, name: newName.trim() });
                                    }
                                  }}
                                  data-testid={`button-rename-workspace-${ws.id}`}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Delete workspace "${ws.name}"? Projects and documents will be unassigned.`)) {
                                      deleteWorkspaceMutation.mutate(ws.id);
                                    }
                                  }}
                                  className="text-destructive"
                                  data-testid={`button-delete-workspace-${ws.id}`}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {isExpanded && (
                            <div className="ml-3 mt-0.5 space-y-0.5">
                              {wsData.projects.map((proj) => {
                                const projDocs = docsByProject[proj.id] || [];
                                const isProjExpanded = expandedWsProjects[proj.id] ?? false;
                                return (
                                  <div key={proj.id}>
                                    <div
                                      className="group/proj flex items-center gap-1.5 px-2 py-1 cursor-pointer rounded-md transition-colors hover-elevate"
                                      onClick={() => setExpandedWsProjects(prev => ({ ...prev, [proj.id]: !prev[proj.id] }))}
                                      data-testid={`sidebar-ws-project-${proj.id}`}
                                    >
                                      {isProjExpanded ? <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" /> : <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" />}
                                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: proj.color }} />
                                      <span className="text-[11px] text-muted-foreground truncate flex-1">{proj.name}</span>
                                      <span className="text-[10px] text-muted-foreground/40">{projDocs.length}</span>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button
                                            className="w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover/proj:opacity-100 transition-opacity text-muted-foreground"
                                            onClick={(e) => e.stopPropagation()}
                                            data-testid={`button-project-menu-${proj.id}`}
                                          >
                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const newName = prompt("Rename project:", proj.name);
                                              if (newName && newName.trim() && newName !== proj.name) {
                                                renameProjectMutation.mutate({ id: proj.id, name: newName.trim() });
                                              }
                                            }}
                                            data-testid={`button-rename-project-${proj.id}`}
                                          >
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Rename
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (confirm(`Delete project "${proj.name}"?`)) {
                                                deleteProjectMutation.mutate(proj.id);
                                              }
                                            }}
                                            className="text-destructive"
                                            data-testid={`button-delete-project-${proj.id}`}
                                          >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    {isProjExpanded && projDocs.length > 0 && (
                                      <div className="ml-3 space-y-0.5">
                                        {projDocs.map((doc) => (
                                          <DocItem key={doc.id} {...docItemProps(doc)} />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {wsData.docs.map((doc) => (
                                <DocItem key={doc.id} {...docItemProps(doc)} />
                              ))}
                              {wsData.projects.length === 0 && wsData.docs.length === 0 && (
                                <p className="text-[10px] text-muted-foreground/30 px-2 py-1">Empty workspace</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </NavSection>

              <NavSection
                icon={Star}
                label="Favorites"
                count={favoriteDocs.length}
                expanded={expandedSections.favorites}
                onToggle={() => toggleSection("favorites")}
                testId="nav-favorites"
              >
                {favoriteDocs.length === 0 ? (
                  <p className="text-xs text-muted-foreground/40 px-2 py-2">No favorites yet</p>
                ) : (
                  <div className="space-y-0.5">
                    {favoriteDocs.map((doc) => (
                      <DocItem key={doc.id} {...docItemProps(doc)} />
                    ))}
                  </div>
                )}
              </NavSection>

              <NavSection
                icon={FolderOpen}
                label="Projects"
                count={projects.length}
                expanded={expandedSections.projects}
                onToggle={() => toggleSection("projects")}
                onPlusClick={() => setProjectManagerOpen(true)}
                plusTitle="New project"
                testId="nav-projects"
              >
                {projects.length === 0 ? (
                  <p className="text-xs text-muted-foreground/40 px-2 py-2">No projects yet</p>
                ) : (
                  <div className="space-y-1">
                    {projects.map((project) => {
                      const projectDocs = docsByProject[project.id] || [];
                      return (
                        <div key={project.id}>
                          <div className="group flex items-center gap-1.5 px-2 py-1 rounded-md hover-elevate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                            <span className="text-[11px] font-medium text-muted-foreground truncate flex-1">{project.name}</span>
                            <span className="text-[10px] text-muted-foreground/40">{projectDocs.length}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`button-project-menu-${project.id}`}
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newName = prompt("Rename project:", project.name);
                                    if (newName && newName.trim() && newName !== project.name) {
                                      renameProjectMutation.mutate({ id: project.id, name: newName.trim() });
                                    }
                                  }}
                                  data-testid={`button-rename-project-${project.id}`}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Delete project "${project.name}"?`)) {
                                      deleteProjectMutation.mutate(project.id);
                                    }
                                  }}
                                  className="text-destructive"
                                  data-testid={`button-delete-project-${project.id}`}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {projectDocs.length > 0 && (
                            <div className="space-y-0.5 ml-1">
                              {projectDocs.map((doc) => (
                                <DocItem key={doc.id} {...docItemProps(doc)} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </NavSection>

              <NavSection
                icon={FileText}
                label="Documents"
                count={allNonFavDocs.length}
                expanded={expandedSections.documents}
                onToggle={() => toggleSection("documents")}
                onPlusClick={() => createMutation.mutate()}
                plusTitle="New document"
                testId="nav-documents"
              >
                {isLoading ? (
                  <div className="py-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-7 rounded-md bg-muted/40 mb-1 animate-pulse" />
                    ))}
                  </div>
                ) : (docsByProject["_unassigned"] || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground/40 px-2 py-2">No unassigned documents</p>
                ) : (
                  <div className="space-y-0.5">
                    {(docsByProject["_unassigned"] || []).map((doc) => (
                      <DocItem key={doc.id} {...docItemProps(doc)} />
                    ))}
                  </div>
                )}
              </NavSection>

              <NavSection
                icon={TagIcon}
                label="Tags"
                count={allTags.length}
                expanded={expandedSections.tags}
                onToggle={() => toggleSection("tags")}
                onPlusClick={() => setTagManagerOpen(true)}
                plusTitle="New tag"
                testId="nav-tags"
              >
                {allTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground/40 px-2 py-2">No tags yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1 px-2 py-1">
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
                )}
              </NavSection>
            </div>
          )}
        </div>
      </div>

      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
      <ProjectManager isOpen={projectManagerOpen} onClose={() => setProjectManagerOpen(false)} />
      <TagManager isOpen={tagManagerOpen} onClose={() => setTagManagerOpen(false)} />
      <WorkspaceManager isOpen={workspaceManagerOpen} onClose={() => setWorkspaceManagerOpen(false)} />
    </>
  );
}

function SidebarIconButton({
  icon: Icon,
  label,
  badge,
  isActive,
  onClick,
  onPlusClick,
  testId,
}: {
  icon: any;
  label: string;
  badge?: number;
  isActive?: boolean;
  onClick: () => void;
  onPlusClick?: () => void;
  testId: string;
}) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-9 h-9 flex items-center justify-center rounded-md transition-colors duration-150 hover-elevate ${
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        }`}
        title={label}
        data-testid={`button-${testId}`}
      >
        <Icon className="w-4 h-4" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center font-medium">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>
      {onPlusClick && (
        <button
          onClick={(e) => { e.stopPropagation(); onPlusClick(); }}
          className="absolute -right-0.5 -bottom-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title={`New ${label.toLowerCase()}`}
          data-testid={`button-add-${testId}`}
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

function NavSection({
  icon: Icon,
  label,
  count,
  expanded,
  isActive,
  onClick,
  onToggle,
  onPlusClick,
  plusTitle,
  testId,
  children,
}: {
  icon: any;
  label: string;
  count?: number;
  expanded?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  onToggle?: () => void;
  onPlusClick?: () => void;
  plusTitle?: string;
  testId: string;
  children?: any;
}) {
  const isExpandable = onToggle !== undefined;

  return (
    <div className="mb-1">
      <div
        onClick={onClick || onToggle}
        className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors duration-100 hover-elevate ${
          isActive ? "bg-accent text-accent-foreground" : ""
        }`}
        data-testid={`button-${testId}`}
      >
        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-foreground/80 uppercase tracking-wider flex-1">{label}</span>
        {count !== undefined && (
          <span className="text-[10px] text-muted-foreground/40">{count}</span>
        )}
        {onPlusClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlusClick(); }}
            className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity hover-elevate"
            title={plusTitle}
            data-testid={`button-add-${testId}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
        {isExpandable && (
          expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground/40 shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        )}
      </div>
      {isExpandable && expanded && (
        <div className="mt-0.5 mb-1">
          {children}
        </div>
      )}
    </div>
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
