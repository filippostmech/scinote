import type { Document, Tag, Project } from "@shared/schema";
import { FileText, Clock, Calendar } from "lucide-react";
import { useLocation } from "wouter";

interface DocCardProps {
  doc: Document;
  project?: Project;
  docTags?: Tag[];
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function relativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function DocCard({ doc, project, docTags }: DocCardProps) {
  const [, setLocation] = useLocation();

  return (
    <button
      onClick={() => setLocation(`/doc/${doc.id}`)}
      className="w-full text-left p-4 rounded-lg border border-border bg-card transition-colors duration-150 hover-elevate"
      data-testid={`doc-card-${doc.id}`}
    >
      <div className="flex items-start gap-3 mb-2">
        <span className="text-xl shrink-0">{doc.icon || "📄"}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{doc.title || "Untitled"}</p>
          <div className="flex items-center gap-3 mt-1">
            {project && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                {project.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {docTags && docTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {docTags.map((tag) => (
            <span
              key={tag.id}
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: tag.color + "18",
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(doc.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {relativeTime(doc.updatedAt)}
        </span>
        <span className="ml-auto text-[10px]">v{doc.version}</span>
      </div>
    </button>
  );
}

export { formatDate, relativeTime };
