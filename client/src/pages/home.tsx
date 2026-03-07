import { FlaskConical, ArrowRight, FileText, Beaker, ClipboardList, BookOpen, Calendar, FolderOpen, Plus } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Document, Project, Tag } from "@shared/schema";
import { useState, useMemo } from "react";
import { CalendarView } from "@/components/calendar-view";
import { ProjectView } from "@/components/project-view";

function genId() {
  return Math.random().toString(36).substr(2, 9);
}

const templates = [
  {
    title: "Lab Report",
    icon: "🧪",
    description: "Structured lab report with hypothesis, methods, results, and conclusions",
    iconComponent: Beaker,
    blocks: [
      { id: genId(), type: "heading1" as const, content: "Experiment Title" },
      { id: genId(), type: "text" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Objective" },
      { id: genId(), type: "text" as const, content: "State the purpose of the experiment." },
      { id: genId(), type: "heading2" as const, content: "Hypothesis" },
      { id: genId(), type: "text" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Materials & Methods" },
      { id: genId(), type: "bulleted-list" as const, content: "Material 1" },
      { id: genId(), type: "bulleted-list" as const, content: "Material 2" },
      { id: genId(), type: "text" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Results" },
      { id: genId(), type: "text" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Discussion" },
      { id: genId(), type: "text" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Conclusion" },
      { id: genId(), type: "text" as const, content: "" },
    ],
  },
  {
    title: "Protocol",
    icon: "📋",
    description: "Step-by-step experimental protocol with safety notes",
    iconComponent: ClipboardList,
    blocks: [
      { id: genId(), type: "heading1" as const, content: "Protocol Name" },
      { id: genId(), type: "text" as const, content: "" },
      { id: genId(), type: "callout" as const, content: "Safety: Wear appropriate PPE at all times." },
      { id: genId(), type: "heading2" as const, content: "Reagents & Equipment" },
      { id: genId(), type: "bulleted-list" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Procedure" },
      { id: genId(), type: "numbered-list" as const, content: "Step 1" },
      { id: genId(), type: "numbered-list" as const, content: "Step 2" },
      { id: genId(), type: "numbered-list" as const, content: "Step 3" },
      { id: genId(), type: "heading2" as const, content: "Expected Results" },
      { id: genId(), type: "text" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Notes" },
      { id: genId(), type: "text" as const, content: "" },
    ],
  },
  {
    title: "Meeting Notes",
    icon: "📝",
    description: "Capture action items and decisions from team meetings",
    iconComponent: FileText,
    blocks: [
      { id: genId(), type: "heading1" as const, content: "Meeting Notes" },
      { id: genId(), type: "text" as const, content: "<b>Date:</b> " },
      { id: genId(), type: "text" as const, content: "<b>Attendees:</b> " },
      { id: genId(), type: "divider" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Agenda" },
      { id: genId(), type: "bulleted-list" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Discussion" },
      { id: genId(), type: "text" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Action Items" },
      { id: genId(), type: "bulleted-list" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Next Steps" },
      { id: genId(), type: "text" as const, content: "" },
    ],
  },
  {
    title: "Research Log",
    icon: "📖",
    description: "Daily research log to track observations and ideas",
    iconComponent: BookOpen,
    blocks: [
      { id: genId(), type: "heading1" as const, content: "Research Log" },
      { id: genId(), type: "text" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Today's Objectives" },
      { id: genId(), type: "bulleted-list" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Observations" },
      { id: genId(), type: "text" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Data Collected" },
      { id: genId(), type: "text" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Issues & Questions" },
      { id: genId(), type: "bulleted-list" as const, content: "" },
      { id: genId(), type: "heading2" as const, content: "Ideas & Next Steps" },
      { id: genId(), type: "text" as const, content: "" },
    ],
  },
];

type ViewTab = "calendar" | "projects";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<ViewTab>("calendar");

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  const docIds = useMemo(() => documents.map(d => d.id).join(","), [documents]);

  const { data: tagsByDoc = {} } = useQuery<Record<string, Tag[]>>({
    queryKey: ["/api/documents/tags/batch", docIds],
    queryFn: async () => {
      if (!docIds) return {};
      const res = await fetch(`/api/documents/tags/batch?ids=${docIds}`);
      return res.json();
    },
    enabled: documents.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (data?: { title: string; blocks: any[]; icon?: string }) => {
      const res = await apiRequest("POST", "/api/documents", data || {
        title: "Untitled",
        blocks: [{ id: genId(), type: "text", content: "" }],
      });
      return res.json();
    },
    onSuccess: (doc: Document) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setLocation(`/doc/${doc.id}`);
    },
  });

  const recentDocs = useMemo(() => {
    return documents.slice(0, 6);
  }, [documents]);

  return (
    <div className="h-full overflow-y-auto" data-testid="home-page">
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {documents.length} document{documents.length !== 1 ? "s" : ""} across {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-foreground text-background text-sm font-medium transition-colors duration-150 hover-elevate"
            data-testid="button-new-document"
          >
            <Plus className="w-4 h-4" />
            New Document
          </button>
        </div>

        {recentDocs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recently Modified</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recentDocs.map((doc) => {
                const proj = projects.find(p => p.id === doc.projectId);
                return (
                  <button
                    key={doc.id}
                    onClick={() => setLocation(`/doc/${doc.id}`)}
                    className="shrink-0 w-[180px] text-left p-3 rounded-lg border border-border bg-card transition-colors duration-150 hover-elevate"
                    data-testid={`recent-doc-${doc.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{doc.icon || "📄"}</span>
                      <span className="text-xs font-medium text-foreground truncate">{doc.title || "Untitled"}</span>
                    </div>
                    {proj && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: proj.color }} />
                        <span className="text-[10px] text-muted-foreground">{proj.name}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center gap-1 mb-4 border-b border-border">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
                activeTab === "calendar"
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground"
              }`}
              data-testid="tab-calendar"
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
                activeTab === "projects"
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground"
              }`}
              data-testid="tab-projects"
            >
              <FolderOpen className="w-4 h-4" />
              Projects
            </button>
          </div>

          {activeTab === "calendar" && (
            <CalendarView documents={documents} projects={projects} tagsByDoc={tagsByDoc} />
          )}

          {activeTab === "projects" && (
            <ProjectView documents={documents} projects={projects} tagsByDoc={tagsByDoc} />
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Quick-start templates</h2>
          <div className="grid grid-cols-2 gap-3">
            {templates.map((template) => {
              const Icon = template.iconComponent;
              return (
                <button
                  key={template.title}
                  onClick={() => createMutation.mutate({
                    title: template.title,
                    blocks: template.blocks,
                    icon: template.icon,
                  })}
                  disabled={createMutation.isPending}
                  className="text-left p-4 rounded-lg border border-border bg-card transition-colors duration-150 hover-elevate"
                  data-testid={`template-${template.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-[#2EAADC]" />
                    <span className="text-sm font-medium text-foreground">{template.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{template.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-accent/40 rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Keyboard shortcuts</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-2">
              <span>Slash commands</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">/</kbd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Bold</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+B</kbd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Italic</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+I</kbd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Inline code</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+E</kbd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Link</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+K</kbd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Search</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+P</kbd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Undo</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+Z</kbd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Redo</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+Y</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
