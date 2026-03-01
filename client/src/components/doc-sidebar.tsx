import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Document } from "@shared/schema";
import { Plus, FileText, Search, Trash2, MoreHorizontal, FlaskConical } from "lucide-react";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DocSidebar() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/documents", {
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

  const filteredDocs = useMemo(() => {
    if (!searchQuery) return documents;
    return documents.filter((d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [documents, searchQuery]);

  const activeDocId = location.startsWith("/doc/") ? location.split("/doc/")[1] : null;

  return (
    <div className="w-[260px] h-full flex flex-col border-r border-border bg-[#FBFBFA] dark:bg-[#191919] shrink-0" data-testid="doc-sidebar">
      <div className="p-3 pb-2">
        <div className="flex items-center gap-2 px-2 mb-3">
          <FlaskConical className="w-5 h-5 text-[#2EAADC]" />
          <span className="text-sm font-semibold text-foreground tracking-tight">SciNote</span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-sm bg-background/60 border border-transparent focus:border-border rounded-md outline-none transition-colors placeholder:text-muted-foreground/50"
            data-testid="input-search"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
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
        ) : filteredDocs.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/60">
              {searchQuery ? "No matching documents" : "No documents yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors duration-100 ${
                  activeDocId === doc.id
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/80"
                } hover-elevate`}
                onClick={() => setLocation(`/doc/${doc.id}`)}
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
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(doc.id);
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
  );
}
