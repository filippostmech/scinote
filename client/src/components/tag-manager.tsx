import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Tag } from "@shared/schema";
import { X, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const TAG_COLORS = [
  "#787774", "#2EAADC", "#E03E3E", "#D9730D",
  "#DFAB01", "#0F7B6C", "#6940A5", "#AD1A72",
];

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TagManager({ isOpen, onClose }: TagManagerProps) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tags", { name: newName, color: newColor });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      setNewName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/tags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" data-testid="tag-manager-modal">
      <div className="w-full max-w-sm bg-popover border border-popover-border rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Manage Tags</h3>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover-elevate" data-testid="button-close-tag-manager">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tag name"
              className="flex-1 h-8 px-3 text-sm bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary"
              data-testid="input-tag-name"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) createMutation.mutate();
              }}
            />
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newName.trim() || createMutation.isPending}
              className="h-8 px-3 text-sm bg-primary text-primary-foreground rounded-md hover-elevate disabled:opacity-50"
              data-testid="button-add-tag"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-1.5 mb-4">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-5 h-5 rounded-full border-2 ${newColor === c ? "border-foreground" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 text-center py-4">No tags created yet</p>
            ) : (
              tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="text-sm text-foreground flex-1">{tag.name}</span>
                  <button
                    onClick={() => deleteMutation.mutate(tag.id)}
                    className="w-6 h-6 flex items-center justify-center rounded text-destructive/60 transition-colors hover-elevate shrink-0"
                    title="Delete tag"
                    data-testid={`button-delete-tag-${tag.id}`}
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
