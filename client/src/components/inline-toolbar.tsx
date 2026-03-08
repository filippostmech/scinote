import { useCallback, useRef, useEffect } from "react";
import { Bold, Italic, Underline, Strikethrough, Link, Highlighter, Code } from "lucide-react";

interface InlineToolbarProps {
  position: { x: number; y: number };
  blockId: string;
}

export function InlineToolbar({ position }: InlineToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
  }, []);

  const handleBold = useCallback(() => execCommand("bold"), [execCommand]);
  const handleItalic = useCallback(() => execCommand("italic"), [execCommand]);
  const handleUnderline = useCallback(() => execCommand("underline"), [execCommand]);
  const handleStrikethrough = useCallback(() => execCommand("strikeThrough"), [execCommand]);
  const handleCode = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const text = range.toString();
    const codeEl = document.createElement("code");
    codeEl.className = "px-1.5 py-0.5 rounded bg-muted dark:bg-muted font-mono text-sm text-destructive";
    codeEl.textContent = text;
    range.deleteContents();
    range.insertNode(codeEl);
    sel.removeAllRanges();
  }, []);

  const handleHighlight = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const text = range.toString();
    const mark = document.createElement("mark");
    mark.className = "bg-yellow-200/60 dark:bg-yellow-500/30 rounded px-0.5";
    mark.textContent = text;
    range.deleteContents();
    range.insertNode(mark);
    sel.removeAllRanges();
  }, []);

  const handleLink = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
      const links = document.querySelectorAll("a[href]");
      links.forEach((link) => {
        (link as HTMLElement).className = "text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary";
        (link as HTMLElement).setAttribute("target", "_blank");
        (link as HTMLElement).setAttribute("rel", "noopener noreferrer");
      });
    }
  }, [execCommand]);

  useEffect(() => {
    if (toolbarRef.current) {
      const rect = toolbarRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      if (rect.right > vw) {
        toolbarRef.current.style.left = `${vw - rect.width - 16}px`;
      }
    }
  }, [position]);

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 flex items-center gap-0.5 bg-popover border border-popover-border rounded-lg shadow-lg px-1 py-1"
      style={{
        left: position.x,
        top: position.y,
        transform: "translateX(-50%) translateY(-100%)",
      }}
      data-testid="inline-toolbar"
      onMouseDown={(e) => e.preventDefault()}
    >
      <ToolbarButton onClick={handleBold} title="Bold" testId="toolbar-bold">
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={handleItalic} title="Italic" testId="toolbar-italic">
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={handleUnderline} title="Underline" testId="toolbar-underline">
        <Underline className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={handleStrikethrough} title="Strikethrough" testId="toolbar-strikethrough">
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <div className="w-px h-5 bg-border mx-0.5" />
      <ToolbarButton onClick={handleCode} title="Code" testId="toolbar-code">
        <Code className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={handleHighlight} title="Highlight" testId="toolbar-highlight">
        <Highlighter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={handleLink} title="Link" testId="toolbar-link">
        <Link className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
  testId,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <button
      className="w-7 h-7 flex items-center justify-center rounded-md text-foreground/70 transition-colors duration-100 hover-elevate"
      onClick={onClick}
      title={title}
      data-testid={testId}
    >
      {children}
    </button>
  );
}
