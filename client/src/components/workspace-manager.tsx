import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Workspace } from "@shared/schema";
import { X, Trash2 } from "lucide-react";
import { useState } from "react";

const WORKSPACE_COLORS = [
  "#E0F582", "#E65853", "#D9730D", "#DFAB01",
  "#0F7B6C", "#6940A5", "#AD1A72", "#000000",
];

interface WorkspaceManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkspaceManager({ isOpen, onClose }: WorkspaceManagerProps) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(WORKSPACE_COLORS[0]);
  const [newDesc, setNewDesc] = useState("");

  const { data: workspaces = [] } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/workspaces", {
        name: newName,
        color: newColor,
        description: newDesc || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      setNewName("");
      setNewDesc("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/workspaces/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" data-testid="workspace-manager-modal">
      <div className="w-full max-w-sm bg-popover border border-popover-border rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Manage Workspaces</h3>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover-elevate" data-testid="button-close-workspace-manager">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Workspace name"
            className="w-full h-8 px-3 text-sm bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary mb-2"
            data-testid="input-workspace-name"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full h-8 px-3 text-sm bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary mb-2"
            data-testid="input-workspace-desc"
          />

          <div className="flex gap-1.5 mb-3">
            {WORKSPACE_COLORS.map((c) => (
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
            data-testid="button-create-workspace"
          >
            Create Workspace
          </button>

          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {workspaces.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 text-center py-4">No workspaces created yet</p>
            ) : (
              workspaces.map((ws) => (
                <div key={ws.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ws.color }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground truncate block">{ws.name}</span>
                    {ws.description && (
                      <span className="text-[11px] text-muted-foreground truncate block">{ws.description}</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete workspace "${ws.name}"? Projects and documents will be unassigned.`)) {
                        deleteMutation.mutate(ws.id);
                      }
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded text-destructive/60 transition-colors hover-elevate shrink-0"
                    title="Delete workspace"
                    data-testid={`button-delete-workspace-${ws.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
