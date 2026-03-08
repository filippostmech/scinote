import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { Project, Tag, Workspace } from "@shared/schema";
import { Calendar, Clock, FolderOpen, TagIcon, Plus, X, ChevronDown, Layers } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { formatDate, relativeTime } from "./doc-card";

interface DocMetadataProps {
  docId: string;
  projectId: string | null;
  workspaceId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  version: number;
  onProjectChange: (projectId: string | null) => void;
  onWorkspaceChange: (workspaceId: string | null) => void;
  onTagsChange: (tagIds: string[]) => void;
}

export function DocMetadata({
  docId,
  projectId,
  workspaceId,
  createdAt,
  updatedAt,
  version,
  onProjectChange,
  onWorkspaceChange,
  onTagsChange,
}: DocMetadataProps) {
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const projectRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workspaces = [] } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
  });

  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  const { data: docTags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/documents", docId, "tags"],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${docId}/tags`);
      return res.json();
    },
  });

  const currentProject = projects.find((p) => p.id === projectId);
  const currentWorkspace = workspaces.find((w) => w.id === workspaceId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setShowProjectPicker(false);
      }
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setShowWorkspacePicker(false);
      }
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) {
        setShowTagPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAddTag = (tagId: string) => {
    const newTagIds = [...docTags.map((t) => t.id), tagId];
    onTagsChange(newTagIds);
    queryClient.invalidateQueries({ queryKey: ["/api/documents", docId, "tags"] });
  };

  const handleRemoveTag = (tagId: string) => {
    const newTagIds = docTags.filter((t) => t.id !== tagId).map((t) => t.id);
    onTagsChange(newTagIds);
    queryClient.invalidateQueries({ queryKey: ["/api/documents", docId, "tags"] });
  };

  const availableTags = allTags.filter(
    (t) => !docTags.find((dt) => dt.id === t.id)
  );

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2 mb-4 text-sm print:hidden" data-testid="doc-metadata">
      <div className="relative" ref={workspaceRef}>
        <button
          onClick={() => setShowWorkspacePicker(!showWorkspacePicker)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md transition-colors hover-elevate"
          data-testid="button-workspace-picker"
        >
          {currentWorkspace ? (
            <>
              <span className="w-2 h-2 rounded" style={{ backgroundColor: currentWorkspace.color }} />
              {currentWorkspace.name}
            </>
          ) : (
            <>
              <Layers className="w-3 h-3" />
              Add to workspace
            </>
          )}
          <ChevronDown className="w-3 h-3" />
        </button>

        {showWorkspacePicker && (
          <div className="absolute z-50 top-full left-0 mt-1 w-48 bg-popover border border-popover-border rounded-lg shadow-lg py-1" data-testid="workspace-picker-dropdown">
            <button
              onClick={() => {
                onWorkspaceChange(null);
                setShowWorkspacePicker(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${!workspaceId ? "bg-accent" : ""} hover-elevate`}
            >
              None
            </button>
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  onWorkspaceChange(w.id);
                  setShowWorkspacePicker(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${workspaceId === w.id ? "bg-accent" : ""} hover-elevate`}
                data-testid={`workspace-option-${w.id}`}
              >
                <span className="w-2 h-2 rounded" style={{ backgroundColor: w.color }} />
                {w.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative" ref={projectRef}>
        <button
          onClick={() => setShowProjectPicker(!showProjectPicker)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md transition-colors hover-elevate"
          data-testid="button-project-picker"
        >
          {currentProject ? (
            <>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentProject.color }} />
              {currentProject.name}
            </>
          ) : (
            <>
              <FolderOpen className="w-3 h-3" />
              Add to project
            </>
          )}
          <ChevronDown className="w-3 h-3" />
        </button>

        {showProjectPicker && (
          <div className="absolute z-50 top-full left-0 mt-1 w-48 bg-popover border border-popover-border rounded-lg shadow-lg py-1" data-testid="project-picker-dropdown">
            <button
              onClick={() => {
                onProjectChange(null);
                setShowProjectPicker(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${!projectId ? "bg-accent" : ""} hover-elevate`}
            >
              None
            </button>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onProjectChange(p.id);
                  setShowProjectPicker(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${projectId === p.id ? "bg-accent" : ""} hover-elevate`}
                data-testid={`project-option-${p.id}`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative" ref={tagRef}>
        <div className="flex items-center gap-1.5 flex-wrap">
          {docTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: tag.color + "18", color: tag.color }}
            >
              {tag.name}
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="w-3 h-3 flex items-center justify-center rounded-full transition-colors hover-elevate"
                data-testid={`button-remove-tag-${tag.id}`}
              >
                <X className="w-2 h-2" />
              </button>
            </span>
          ))}
          <button
            onClick={() => setShowTagPicker(!showTagPicker)}
            className="flex items-center gap-1 text-xs text-muted-foreground/60 px-1.5 py-0.5 rounded-md transition-colors hover-elevate"
            data-testid="button-tag-picker"
          >
            <TagIcon className="w-3 h-3" />
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {showTagPicker && (
          <div className="absolute z-50 top-full left-0 mt-1 w-48 bg-popover border border-popover-border rounded-lg shadow-lg py-1" data-testid="tag-picker-dropdown">
            {availableTags.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">No tags available</p>
            )}
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  handleAddTag(tag.id);
                  setShowTagPicker(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors hover-elevate"
                data-testid={`tag-option-${tag.id}`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground/50 ml-auto">
        <Calendar className="w-3 h-3" />
        <span data-testid="text-created-date">{formatDate(createdAt)}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
        <Clock className="w-3 h-3" />
        <span data-testid="text-modified-date">{relativeTime(updatedAt)}</span>
      </div>
    </div>
  );
}
