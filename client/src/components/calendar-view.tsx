import { useMemo, useState } from "react";
import type { Document, Project, Tag } from "@shared/schema";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DocCard } from "./doc-card";

interface CalendarViewProps {
  documents: Document[];
  projects: Project[];
  tagsByDoc: Record<string, Tag[]>;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CalendarView({ documents, projects, tagsByDoc }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const docsByDate = useMemo(() => {
    const map: Record<string, Document[]> = {};
    for (const doc of documents) {
      const created = dateKey(new Date(doc.createdAt));
      if (!map[created]) map[created] = [];
      map[created].push(doc);

      const updated = dateKey(new Date(doc.updatedAt));
      if (updated !== created) {
        if (!map[updated]) map[updated] = [];
        if (!map[updated].find(d => d.id === doc.id)) {
          map[updated].push(doc);
        }
      }
    }
    return map;
  }, [documents]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(dateKey(today));
  };

  const todayKey = dateKey(today);
  const selectedDocs = selectedDate ? (docsByDate[selectedDate] || []) : [];

  const projectMap = useMemo(() => {
    const m: Record<string, Project> = {};
    for (const p of projects) m[p.id] = p;
    return m;
  }, [projects]);

  return (
    <div data-testid="calendar-view">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground transition-colors hover-elevate" data-testid="button-prev-month">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-semibold text-foreground min-w-[180px] text-center">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground transition-colors hover-elevate" data-testid="button-next-month">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button onClick={goToday} className="text-xs text-primary px-2 py-1 rounded-md transition-colors hover-elevate" data-testid="button-today">
          Today
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {DAY_NAMES.map((d) => (
          <div key={d} className="bg-accent/40 px-2 py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-background min-h-[80px]" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const docs = docsByDate[key] || [];
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;

          return (
            <button
              key={key}
              onClick={() => setSelectedDate(isSelected ? null : key)}
              className={`bg-background min-h-[80px] p-1.5 text-left transition-colors relative ${
                isSelected ? "ring-2 ring-primary ring-inset" : ""
              }`}
              data-testid={`calendar-day-${day}`}
            >
              <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                isToday ? "bg-primary text-primary-foreground" : "text-foreground/70"
              }`}>
                {day}
              </span>
              {docs.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {docs.slice(0, 3).map((doc) => (
                    <span
                      key={doc.id}
                      className={`w-1.5 h-1.5 rounded-full ${!(doc.projectId && projectMap[doc.projectId]) ? "bg-primary" : ""}`}
                      style={doc.projectId && projectMap[doc.projectId] ? { backgroundColor: projectMap[doc.projectId].color } : undefined}
                    />
                  ))}
                  {docs.length > 3 && (
                    <span className="text-[9px] text-muted-foreground/50 ml-0.5">+{docs.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Documents on {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </h3>
          {selectedDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground/60">No documents on this date</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedDocs.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  project={doc.projectId ? projectMap[doc.projectId] : undefined}
                  docTags={tagsByDoc[doc.id]}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
