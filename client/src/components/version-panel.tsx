import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DocumentVersion } from "@shared/schema";
import { X, Save, RotateCcw, Clock } from "lucide-react";

interface VersionPanelProps {
  docId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
}

function formatVersionDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function VersionPanel({ docId, isOpen, onClose, onRestore }: VersionPanelProps) {
  const { data: versions = [], isLoading } = useQuery<DocumentVersion[]>({
    queryKey: ["/api/documents", docId, "versions"],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${docId}/versions`);
      return res.json();
    },
    enabled: isOpen,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/documents/${docId}/versions`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", docId, "versions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", docId] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (version: number) => {
      const res = await apiRequest("POST", `/api/documents/${docId}/versions/${version}/restore`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", docId, "versions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", docId] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      onRestore();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="w-[300px] h-full border-l border-border bg-card shrink-0 flex flex-col" data-testid="version-panel">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">Version History</h3>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground transition-colors hover-elevate"
          data-testid="button-close-versions"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-md bg-primary text-primary-foreground text-sm transition-colors hover-elevate disabled:opacity-50"
          data-testid="button-save-version"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? "Saving..." : "Save Version"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-md bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/60">No saved versions yet</p>
            <p className="text-xs text-muted-foreground/40 mt-1">Save a version to create a snapshot</p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className="p-3 rounded-lg border border-border bg-background"
                data-testid={`version-entry-${v.version}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">Version {v.version}</span>
                  <button
                    onClick={() => {
                      if (confirm(`Restore to version ${v.version}? A snapshot of the current state will be saved first.`)) {
                        restoreMutation.mutate(v.version);
                      }
                    }}
                    disabled={restoreMutation.isPending}
                    className="flex items-center gap-1 text-[11px] text-primary px-1.5 py-0.5 rounded transition-colors hover-elevate"
                    data-testid={`button-restore-${v.version}`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore
                  </button>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-1">{v.title}</p>
                <p className="text-[11px] text-muted-foreground/50">{formatVersionDate(v.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
