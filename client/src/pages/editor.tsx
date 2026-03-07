import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useRoute } from "wouter";
import type { Document, Block, Project } from "@shared/schema";
import { BlockEditor } from "@/components/block-editor";
import { Loader2, Download, FileText, ChevronDown, Clock } from "lucide-react";
import { downloadMarkdown } from "@/lib/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocMetadata } from "@/components/doc-metadata";
import { VersionPanel } from "@/components/version-panel";

export default function EditorPage() {
  const [, params] = useRoute("/doc/:id");
  const docId = params?.id;
  const [localBlocks, setLocalBlocks] = useState<Block[] | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);

  const { data: doc, isLoading } = useQuery<Document>({
    queryKey: ["/api/documents", docId],
    enabled: !!docId,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { title?: string; blocks?: Block[]; projectId?: string | null; tagIds?: string[] }) => {
      setSaveStatus("saving");
      const res = await apiRequest("PATCH", `/api/documents/${docId}`, data);
      return res.json();
    },
    onSuccess: () => {
      setSaveStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", docId] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/tags/batch"] });
    },
    onError: () => {
      setSaveStatus("unsaved");
    },
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBlocksChange = useCallback(
    (blocks: Block[]) => {
      setLocalBlocks(blocks);
      setSaveStatus("unsaved");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        updateMutation.mutate({ blocks });
      }, 800);
    },
    [updateMutation],
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      setSaveStatus("unsaved");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        updateMutation.mutate({ title });
      }, 800);
    },
    [updateMutation],
  );

  const handleProjectChange = useCallback(
    (projectId: string | null) => {
      updateMutation.mutate({ projectId });
    },
    [updateMutation],
  );

  const handleTagsChange = useCallback(
    (tagIds: string[]) => {
      updateMutation.mutate({ tagIds });
    },
    [updateMutation],
  );

  const handleDownloadMd = useCallback(() => {
    if (!doc) return;
    const blocks = (localBlocks || doc.blocks as Block[]) || [];
    downloadMarkdown(doc.title, blocks);
  }, [doc, localBlocks]);

  const handleDownloadPdf = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setLocalBlocks(null);
    setSaveStatus("saved");
    setVersionPanelOpen(false);
  }, [docId]);

  const currentBlocks = localBlocks || (doc?.blocks as Block[]) || [];

  const stats = useMemo(() => {
    const text = currentBlocks
      .filter((b) => b.type !== "divider" && b.type !== "image")
      .map((b) => {
        if (b.type === "table" && b.meta?.tableData) {
          return (b.meta.tableData as string[][]).flat().join(" ");
        }
        return b.content.replace(/<[^>]*>/g, "");
      })
      .join(" ")
      .trim();

    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readingTime };
  }, [currentBlocks]);

  const currentProject = useMemo(() => {
    if (!doc?.projectId) return null;
    return projects.find(p => p.id === doc.projectId) || null;
  }, [doc?.projectId, projects]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-editor">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="empty-editor">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">Select a document or create a new one</p>
        </div>
      </div>
    );
  }

  const blocks = (doc.blocks as Block[]) || [];

  return (
    <div className="h-full flex" data-testid="editor-page">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto print-content">
          <div className="max-w-[900px] mx-auto px-6 py-12 md:px-16">
            <div className="flex items-start justify-between gap-4 mb-1">
              <div className="flex-1 min-w-0">
                <TitleInput
                  value={doc.title}
                  onChange={handleTitleChange}
                  icon={doc.icon}
                />
              </div>
              <div className="flex items-center gap-1 mt-2 shrink-0 print:hidden">
                <button
                  onClick={() => setVersionPanelOpen(!versionPanelOpen)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-md text-sm text-muted-foreground transition-colors duration-150 hover-elevate"
                  title="Version history"
                  data-testid="button-version-history"
                >
                  <Clock className="w-4 h-4" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-1.5 h-8 px-3 rounded-md text-sm text-muted-foreground transition-colors duration-150 hover-elevate"
                      title="Download options"
                      data-testid="button-download"
                    >
                      <Download className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleDownloadMd} data-testid="button-download-md">
                      <FileText className="w-4 h-4 mr-2" />
                      Download as .md
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadPdf} data-testid="button-download-pdf">
                      <FileText className="w-4 h-4 mr-2" />
                      Print / Save as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <DocMetadata
              docId={doc.id}
              projectId={doc.projectId}
              createdAt={doc.createdAt}
              updatedAt={doc.updatedAt}
              version={doc.version}
              onProjectChange={handleProjectChange}
              onTagsChange={handleTagsChange}
            />

            <BlockEditor
              blocks={blocks}
              onChange={handleBlocksChange}
            />
            <div className="h-[40vh] print:hidden" />
          </div>
        </div>

        <div className="shrink-0 border-t border-border/50 px-6 py-2 flex items-center gap-4 text-xs text-muted-foreground/50 print:hidden" data-testid="editor-status-bar">
          <span className={`flex items-center gap-1 ${
            saveStatus === "saved" ? "text-green-600/50 dark:text-green-400/50" :
            saveStatus === "saving" ? "text-yellow-600/50 dark:text-yellow-400/50" :
            "text-orange-600/50 dark:text-orange-400/50"
          }`} data-testid="text-save-status">
            <span className={`w-1.5 h-1.5 rounded-full ${
              saveStatus === "saved" ? "bg-green-500/50" :
              saveStatus === "saving" ? "bg-yellow-500/50" :
              "bg-orange-500/50"
            }`} />
            {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Unsaved"}
          </span>
          <span data-testid="text-version">v{doc.version}</span>
          {currentProject && (
            <span className="flex items-center gap-1" data-testid="text-project-name">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentProject.color }} />
              {currentProject.name}
            </span>
          )}
          <span className="ml-auto" data-testid="text-word-count">{stats.words} words</span>
          <span data-testid="text-char-count">{stats.chars} characters</span>
          <span data-testid="text-reading-time">{stats.readingTime} min read</span>
        </div>
      </div>

      {docId && (
        <VersionPanel
          docId={docId}
          isOpen={versionPanelOpen}
          onClose={() => setVersionPanelOpen(false)}
          onRestore={() => {
            setLocalBlocks(null);
          }}
        />
      )}
    </div>
  );
}

function TitleInput({
  value,
  onChange,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  icon?: string | null;
}) {
  const [localValue, setLocalValue] = useState(value === "Untitled" ? "" : value);

  useEffect(() => {
    setLocalValue(value === "Untitled" ? "" : value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setLocalValue(text);
    onChange(text || "Untitled");
  };

  return (
    <div className="mb-2">
      {icon && <span className="text-5xl mb-4 block" data-testid="doc-icon">{icon}</span>}
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder="Untitled"
        dir="ltr"
        className="w-full text-[40px] font-bold leading-tight outline-none text-foreground bg-transparent placeholder:text-muted-foreground/40 border-none p-0"
        style={{ fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}
        data-testid="input-title"
      />
    </div>
  );
}
