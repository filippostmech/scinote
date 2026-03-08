import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Project, Workspace } from "@shared/schema";
import { X, Trash2 } from "lucide-react";
import { useState } from "react";

const PROJECT_COLORS = [
  "#E0F582", "#E65853", "#D9730D", "#DFAB01",
  "#0F7B6C", "#6940A5", "#AD1A72", "#000000",
];

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectManager({ isOpen, onClose }: ProjectManagerProps) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0]);
  const [newDesc, setNewDesc] = useState("");
  const [newWorkspaceId, setNewWorkspaceId] = useState<string | null>(null);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workspaces = [] } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/projects", {
        name: newName,
        color: newColor,
        description: newDesc || undefined,
        workspaceId: newWorkspaceId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setNewName("");
      setNewDesc("");
      setNewWorkspaceId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" data-testid="project-manager-modal">
      <div className="w-full max-w-sm bg-popover border border-popover-border rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Manage Projects</h3>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover-elevate" data-testid="button-close-project-manager">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            className="w-full h-8 px-3 text-sm bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary mb-2"
            data-testid="input-project-name"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full h-8 px-3 text-sm bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary mb-2"
            data-testid="input-project-desc"
          />

          {workspaces.length > 0 && (
            <div className="mb-2">
              <select
                value={newWorkspaceId || ""}
                onChange={(e) => setNewWorkspaceId(e.target.value || null)}
                className="w-full h-8 px-3 text-sm bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary"
                data-testid="select-project-workspace"
              >
                <option value="">No workspace</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-1.5 mb-3">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-5 h-5 rounded-full border-2 ${newColor === c ? "border-foreground" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <button
            onClick={() => createMutation.mutate()}
            disabled={!newName.trim() || createMutation.isPending}
            className="w-full h-8 text-sm bg-primary text-primary-foreground rounded-md hover-elevate disabled:opacity-50 mb-4"
            data-testid="button-create-project"
          >
            Create Project
          </button>

          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {projects.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 text-center py-4">No projects created yet</p>
            ) : (
              projects.map((project) => {
                const projWs = workspaces.find(w => w.id === project.workspaceId);
                return (
                  <div key={project.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground truncate block">{project.name}</span>
                      <div className="flex items-center gap-1">
                        {project.description && (
                          <span className="text-[11px] text-muted-foreground truncate">{project.description}</span>
                        )}
                        {projWs && (
                          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded" style={{ backgroundColor: projWs.color }} />
                            {projWs.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete project "${project.name}"?`)) {
                          deleteMutation.mutate(project.id);
                        }
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded text-destructive/60 transition-colors hover-elevate shrink-0"
                      title="Delete project"
                      data-testid={`button-delete-project-${project.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
