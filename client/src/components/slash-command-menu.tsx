import { useEffect, useRef, useState, useCallback } from "react";
import type { Block } from "@shared/schema";
import { Type, Heading1, Heading2, Heading3, List, ListOrdered, Code2, Quote, Minus, MessageSquare } from "lucide-react";

interface SlashCommandMenuProps {
  position: { x: number; y: number };
  filter: string;
  onSelect: (type: Block["type"]) => void;
  onClose: () => void;
}

const commands: {
  type: Block["type"];
  label: string;
  description: string;
  icon: typeof Type;
  keywords: string[];
}[] = [
  { type: "text", label: "Text", description: "Plain text block", icon: Type, keywords: ["paragraph", "p", "text"] },
  { type: "heading1", label: "Heading 1", description: "Large section heading", icon: Heading1, keywords: ["h1", "heading", "title"] },
  { type: "heading2", label: "Heading 2", description: "Medium section heading", icon: Heading2, keywords: ["h2", "heading", "subtitle"] },
  { type: "heading3", label: "Heading 3", description: "Small section heading", icon: Heading3, keywords: ["h3", "heading"] },
  { type: "bulleted-list", label: "Bulleted List", description: "Unordered list item", icon: List, keywords: ["ul", "bullet", "list", "unordered"] },
  { type: "numbered-list", label: "Numbered List", description: "Ordered list item", icon: ListOrdered, keywords: ["ol", "number", "list", "ordered"] },
  { type: "code", label: "Code", description: "Code block with syntax", icon: Code2, keywords: ["code", "pre", "snippet", "programming"] },
  { type: "quote", label: "Quote", description: "Blockquote for citations", icon: Quote, keywords: ["quote", "blockquote", "citation"] },
  { type: "callout", label: "Callout", description: "Highlighted info block", icon: MessageSquare, keywords: ["callout", "info", "note", "warning"] },
  { type: "divider", label: "Divider", description: "Horizontal rule separator", icon: Minus, keywords: ["divider", "hr", "line", "separator"] },
];

export function SlashCommandMenu({ position, filter, onSelect, onClose }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const filteredCommands = commands.filter((cmd) => {
    if (!filter) return true;
    const lower = filter.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(lower) ||
      cmd.description.toLowerCase().includes(lower) ||
      cmd.keywords.some((k) => k.includes(lower))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    const el = itemRefs.current.get(selectedIndex);
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].type);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [filteredCommands, selectedIndex, onSelect, onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  if (filteredCommands.length === 0) {
    return (
      <div
        ref={menuRef}
        className="fixed z-50 bg-popover border border-popover-border rounded-lg shadow-lg p-2 w-72"
        style={{ left: position.x, top: position.y }}
        data-testid="slash-menu-empty"
      >
        <p className="text-sm text-muted-foreground px-2 py-1">No results</p>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-popover border border-popover-border rounded-lg shadow-lg py-1 w-72 max-h-80 overflow-y-auto"
      style={{ left: position.x, top: position.y }}
      data-testid="slash-menu"
    >
      <div className="px-2 py-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Basic blocks</p>
      </div>
      {filteredCommands.map((cmd, i) => {
        const Icon = cmd.icon;
        return (
          <button
            key={cmd.type}
            ref={(el: HTMLButtonElement | null) => {
              if (el) itemRefs.current.set(i, el);
            }}
            className={`w-full flex items-center gap-3 px-2 py-2 text-left rounded-md transition-colors duration-100 ${
              i === selectedIndex ? "bg-accent" : ""
            }`}
            onClick={() => onSelect(cmd.type)}
            onMouseEnter={() => setSelectedIndex(i)}
            data-testid={`slash-cmd-${cmd.type}`}
          >
            <div className="w-10 h-10 rounded-md border border-border flex items-center justify-center bg-background shrink-0">
              <Icon className="w-5 h-5 text-foreground/70" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{cmd.label}</p>
              <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
