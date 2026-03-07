import { FlaskConical, ArrowRight, FileText, Beaker, ClipboardList, BookOpen } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Document } from "@shared/schema";

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

export default function HomePage() {
  const [, setLocation] = useLocation();

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

  return (
    <div className="h-full overflow-y-auto" data-testid="home-page">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2EAADC] to-[#2EAADC]/70 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <FlaskConical className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Welcome to SciNote</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed max-w-md mx-auto">
            A distraction-free editor built for scientists and R&D engineers.
            Write, organize, and share your research notes.
          </p>
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-foreground text-background text-sm font-medium transition-colors duration-150 hover-elevate"
            data-testid="button-get-started"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Quick-start templates</h2>
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

        <p className="text-xs text-muted-foreground/60 mt-6 text-center">
          Or select a document from the sidebar
        </p>
      </div>
    </div>
  );
}
