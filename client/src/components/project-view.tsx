import { useMemo, useState } from "react";
import type { Document, Project, Tag } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, FolderOpen, X } from "lucide-react";
import { DocCard } from "./doc-card";

interface ProjectViewProps {
  documents: Document[];
  projects: Project[];
  tagsByDoc: Record<string, Tag[]>;
}

const PROJECT_COLORS = [
  "#2EAADC", "#E03E3E", "#D9730D", "#DFAB01",
  "#0F7B6C", "#6940A5", "#AD1A72", "#787774",
];

export function ProjectView({ documents, projects, tagsByDoc }: ProjectViewProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0]);
  const [newDesc, setNewDesc] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/projects", {
        name: newName,
        color: newColor,
        description: newDesc || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      if (selectedProjectId) setSelectedProjectId(null);
    },
  });

  const projectMap = useMemo(() => {
    const m: Record<string, Project> = {};
    for (const p of projects) m[p.id] = p;
    return m;
  }, [projects]);

  const docsByProject = useMemo(() => {
    const map: Record<string, Document[]> = { unassigned: [] };
    for (const p of projects) map[p.id] = [];
    for (const doc of documents) {
      if (doc.projectId && map[doc.projectId]) {
        map[doc.projectId].push(doc);
      } else {
        map.unassigned.push(doc);
      }
    }
    return map;
  }, [documents, projects]);

  const selectedDocs = selectedProjectId
    ? (docsByProject[selectedProjectId] || [])
    : null;

  const selectedProject = selectedProjectId && selectedProjectId !== "unassigned"
    ? projectMap[selectedProjectId]
    : null;

  return (
    <div data-testid="project-view">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Projects</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 text-sm text-primary px-3 py-1.5 rounded-md transition-colors hover-elevate"
          data-testid="button-create-project"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {showCreate && (
        <div className="mb-4 p-4 rounded-lg border border-border bg-card" data-testid="project-create-form">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary mb-2"
            data-testid="input-project-name"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary mb-2"
            data-testid="input-project-desc"
          />
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">Color:</span>
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-6 h-6 rounded-full border-2 ${newColor === c ? "border-foreground" : "border-transparent"}`}
                style={{ backgroundColor: c }}
                data-testid={`color-${c}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newName.trim() || createMutation.isPending}
              className="h-8 px-4 text-sm bg-primary text-primary-foreground rounded-md transition-colors hover-elevate disabled:opacity-50"
              data-testid="button-save-project"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="h-8 px-4 text-sm text-muted-foreground rounded-md transition-colors hover-elevate"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedDocs !== null ? (
        <div>
          <button
            onClick={() => setSelectedProjectId(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 transition-colors hover-elevate rounded-md px-2 py-1"
          >
            <ChevronBack />
            Back to all projects
          </button>
          <div className="flex items-center gap-2 mb-4">
            {selectedProject && (
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedProject.color }} />
            )}
            <h3 className="text-base font-medium text-foreground">
              {selectedProject ? selectedProject.name : "Unassigned Documents"}
            </h3>
            <span className="text-xs text-muted-foreground">({selectedDocs.length})</span>
          </div>
          {selectedDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground/60">No documents in this project</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedDocs.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  project={doc.projectId ? projectMap[doc.projectId] : undefined}
                  docTags={tagsByDoc[doc.id]}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project) => {
            const docs = docsByProject[project.id] || [];
            const lastUpdated = docs.length > 0
              ? new Date(Math.max(...docs.map(d => new Date(d.updatedAt).getTime())))
              : null;
            return (
              <div
                key={project.id}
                className="group text-left p-4 rounded-lg border border-border bg-card transition-colors duration-150 hover-elevate cursor-pointer"
                onClick={() => setSelectedProjectId(project.id)}
                data-testid={`project-card-${project.id}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                  <span className="text-sm font-medium text-foreground truncate">{project.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete project "${project.name}"? Documents will become unassigned.`)) {
                        deleteMutation.mutate(project.id);
                      }
                    }}
                    className="ml-auto w-5 h-5 flex items-center justify-center rounded text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity hover-elevate"
                    data-testid={`button-delete-project-${project.id}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {project.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                  <span>{docs.length} doc{docs.length !== 1 ? "s" : ""}</span>
                  {lastUpdated && (
                    <span>Updated {lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  )}
                </div>
              </div>
            );
          })}

          {docsByProject.unassigned.length > 0 && (
            <button
              onClick={() => setSelectedProjectId("unassigned")}
              className="text-left p-4 rounded-lg border border-dashed border-border bg-card/50 transition-colors duration-150 hover-elevate"
              data-testid="project-card-unassigned"
            >
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="w-4 h-4 text-muted-foreground/50" />
                <span className="text-sm font-medium text-foreground/70">Unassigned</span>
              </div>
              <div className="text-[11px] text-muted-foreground/60">
                {docsByProject.unassigned.length} doc{docsByProject.unassigned.length !== 1 ? "s" : ""}
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ChevronBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
