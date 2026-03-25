import { forwardRef, useRef, useCallback, useState, useEffect } from "react";
import type { Block } from "@shared/schema";
import { GripVertical, Plus, Trash2, Type, Heading1, Heading2, Heading3, List, ListOrdered, Code2, Quote, Minus, MessageSquare, Table2, ImageIcon, Upload, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TableBlock } from "./table-block";

interface BlockItemProps {
  block: Block;
  index: number;
  listIndex?: number;
  isFocused: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  dropPosition: "above" | "below" | null;
  onFocus: () => void;
  onChange: (content: string) => void;
  onMetaChange: (meta: Record<string, any>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSlashCommand: (position: { x: number; y: number }) => void;
  onSlashFilter: (filter: string) => void;
  onMarkdownShortcut: (type: Block["type"], content: string) => void;
  onAddBlock: () => void;
  onDeleteBlock: () => void;
  onChangeType: (type: Block["type"]) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

const blockTypeIcons: Record<Block["type"], typeof Type> = {
  text: Type,
  "heading1": Heading1,
  "heading2": Heading2,
  "heading3": Heading3,
  "bulleted-list": List,
  "numbered-list": ListOrdered,
  code: Code2,
  quote: Quote,
  divider: Minus,
  callout: MessageSquare,
  table: Table2,
  image: ImageIcon,
};

const blockTypeLabels: Record<Block["type"], string> = {
  text: "Text",
  "heading1": "Heading 1",
  "heading2": "Heading 2",
  "heading3": "Heading 3",
  "bulleted-list": "Bulleted List",
  "numbered-list": "Numbered List",
  code: "Code",
  quote: "Quote",
  divider: "Divider",
  callout: "Callout",
  table: "Table",
  image: "Image",
};

const markdownPatterns: { pattern: RegExp; type: Block["type"] }[] = [
  { pattern: /^### $/, type: "heading3" },
  { pattern: /^## $/, type: "heading2" },
  { pattern: /^# $/, type: "heading1" },
  { pattern: /^[-*] $/, type: "bulleted-list" },
  { pattern: /^1\. $/, type: "numbered-list" },
  { pattern: /^> $/, type: "quote" },
  { pattern: /^---$/, type: "divider" },
  { pattern: /^```$/, type: "code" },
];

export const BlockItem = forwardRef<HTMLDivElement, BlockItemProps>(
  (
    {
      block,
      index,
      listIndex,
      isFocused,
      isDragging,
      isDragOver,
      dropPosition,
      onFocus,
      onChange,
      onMetaChange,
      onKeyDown,
      onSlashCommand,
      onSlashFilter,
      onMarkdownShortcut,
      onAddBlock,
      onDeleteBlock,
      onChangeType,
      onDragStart,
      onDragOver,
      onDrop,
      onDragEnd,
    },
    ref,
  ) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const slashActiveRef = useRef(false);

    useEffect(() => {
      if (contentRef.current && block.type !== "divider" && block.type !== "table" && block.type !== "image") {
        if (contentRef.current.innerHTML !== block.content) {
          contentRef.current.innerHTML = block.content;
        }
      }
    }, [block.id]);

    const handleInput = useCallback(() => {
      if (!contentRef.current) return;
      const html = contentRef.current.innerHTML;
      const text = contentRef.current.textContent || "";
      onChange(html);

      if (block.type === "text") {
        for (const { pattern, type } of markdownPatterns) {
          if (pattern.test(text)) {
            contentRef.current.innerHTML = "";
            onMarkdownShortcut(type, "");
            return;
          }
        }
      }

      const slashMatch = text.match(/\/([^\s]*)$/);
      if (slashMatch) {
        slashActiveRef.current = true;
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          onSlashCommand({ x: rect.left, y: rect.bottom + 4 });
        }
        onSlashFilter(slashMatch[1]);
      } else if (slashActiveRef.current) {
        slashActiveRef.current = false;
      }
    }, [onChange, onSlashCommand, onSlashFilter, onMarkdownShortcut, block.type]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Tab") {
          e.preventDefault();
          if (block.type === "code" && contentRef.current) {
            document.execCommand("insertText", false, "  ");
          }
          return;
        }

        const isMod = e.ctrlKey || e.metaKey;
        if (isMod && e.key === "b") {
          e.preventDefault();
          document.execCommand("bold", false);
          return;
        }
        if (isMod && e.key === "i") {
          e.preventDefault();
          document.execCommand("italic", false);
          return;
        }
        if (isMod && e.key === "u") {
          e.preventDefault();
          document.execCommand("underline", false);
          return;
        }
        if (isMod && e.shiftKey && e.key === "S") {
          e.preventDefault();
          document.execCommand("strikeThrough", false);
          return;
        }
        if (isMod && e.key === "e") {
          e.preventDefault();
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const text = range.toString();
            const codeEl = document.createElement("code");
            codeEl.className = "px-1.5 py-0.5 rounded bg-muted dark:bg-muted font-mono text-sm text-destructive";
            codeEl.textContent = text;
            range.deleteContents();
            range.insertNode(codeEl);
          }
          return;
        }
        if (isMod && e.shiftKey && e.key === "H") {
          e.preventDefault();
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const text = range.toString();
            const mark = document.createElement("mark");
            mark.className = "bg-yellow-200/60 dark:bg-yellow-500/30 rounded px-0.5";
            mark.textContent = text;
            range.deleteContents();
            range.insertNode(mark);
          }
          return;
        }
        if (isMod && e.key === "k") {
          e.preventDefault();
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed) {
            const url = prompt("Enter URL:");
            if (url) {
              document.execCommand("createLink", false, url);
            }
          }
          return;
        }

        onKeyDown(e);
      },
      [onKeyDown, block.type],
    );

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
      if (block.type === "code") {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
      }
    }, [block.type]);

    const handleImageUpload = useCallback(() => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          alert("Image must be smaller than 5 MB");
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          onChange(dataUrl);
          onMetaChange({ ...block.meta, caption: block.meta?.caption || "" });
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }, [onChange, onMetaChange, block.meta]);

    const dropIndicatorClass = isDragOver && dropPosition
      ? dropPosition === "above"
        ? "before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-primary"
        : "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
      : "";

    if (block.type === "image") {
      return (
        <div
          ref={ref}
          data-block-id={block.id}
          className={`group relative py-2 ${dropIndicatorClass} ${isDragging ? "opacity-30" : ""}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDragOver={onDragOver}
          onDrop={onDrop}
          data-testid={`block-image-${index}`}
        >
          <BlockControls
            isVisible={isHovered}
            onAddBlock={onAddBlock}
            onDeleteBlock={onDeleteBlock}
            onChangeType={onChangeType}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            blockType={block.type}
          />
          <div>
            {block.content ? (
              <div className="my-2">
                <img
                  src={block.content}
                  alt={block.meta?.caption || "Image"}
                  className="max-w-full rounded-md"
                  data-testid={`image-display-${index}`}
                />
                <input
                  type="text"
                  value={block.meta?.caption || ""}
                  onChange={(e) => onMetaChange({ ...block.meta, caption: e.target.value })}
                  placeholder="Add a caption..."
                  className="w-full mt-2 text-sm text-muted-foreground bg-transparent outline-none border-none placeholder:text-muted-foreground/40"
                  data-testid={`input-caption-${index}`}
                />
              </div>
            ) : (
              <button
                onClick={handleImageUpload}
                className="w-full flex items-center justify-center gap-2 py-8 border border-dashed border-border rounded-md text-muted-foreground/60 transition-colors hover-elevate"
                data-testid={`button-upload-image-${index}`}
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm">Click to upload an image</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    if (block.type === "table") {
      return (
        <div
          ref={ref}
          data-block-id={block.id}
          className={`group relative ${dropIndicatorClass} ${isDragging ? "opacity-30" : ""}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDragOver={onDragOver}
          onDrop={onDrop}
          data-testid={`block-table-${index}`}
        >
          <BlockControls
            isVisible={isHovered}
            onAddBlock={onAddBlock}
            onDeleteBlock={onDeleteBlock}
            onChangeType={onChangeType}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            blockType={block.type}
          />
          <div>
            <TableBlock
              meta={block.meta}
              onMetaChange={(meta) => onMetaChange(meta)}
            />
          </div>
        </div>
      );
    }

    if (block.type === "divider") {
      return (
        <div
          ref={ref}
          data-block-id={block.id}
          className={`group relative py-2 ${dropIndicatorClass} ${isDragging ? "opacity-30" : ""}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDragOver={onDragOver}
          onDrop={onDrop}
          data-testid={`block-divider-${index}`}
        >
          <BlockControls
            isVisible={isHovered}
            onAddBlock={onAddBlock}
            onDeleteBlock={onDeleteBlock}
            onChangeType={onChangeType}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            blockType={block.type}
          />
          <div>
            <hr className="border-t border-border" />
          </div>
        </div>
      );
    }

    const blockStyles = getBlockStyles(block.type);
    const placeholder = getPlaceholder(block.type, index);
    const alignClass = getAlignClass(block.meta?.align);

    return (
      <div
        ref={ref}
        data-block-id={block.id}
        className={`group relative ${dropIndicatorClass} ${isDragging ? "opacity-30 scale-[0.98] transition-transform" : "transition-transform"}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={onDragOver}
        onDrop={onDrop}
        data-testid={`block-${block.type}-${index}`}
      >
        <BlockControls
          isVisible={isHovered}
          onAddBlock={onAddBlock}
          onDeleteBlock={onDeleteBlock}
          onChangeType={onChangeType}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          blockType={block.type}
          currentAlign={block.meta?.align || "left"}
          onAlignChange={(align: string) => onMetaChange({ ...block.meta, align })}
        />
        <div className={`${getWrapperStyles(block.type)}`}>
          {block.type === "callout" && (
            <div className={`flex items-start gap-3 p-4 rounded-md bg-accent/50 ${alignClass}`}>
              <span className="text-xl mt-0.5 select-none">💡</span>
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                dir="ltr"
                className={`flex-1 outline-none ${blockStyles}`}
                data-placeholder={placeholder}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={onFocus}
                onPaste={handlePaste}
                data-testid={`input-block-${index}`}
              />
            </div>
          )}
          {block.type === "code" && (
            <div className="rounded-md overflow-hidden">
              <pre className={`bg-muted dark:bg-muted p-4 rounded-md overflow-x-auto ${alignClass}`}>
                <code
                  ref={contentRef}
                  contentEditable
                  suppressContentEditableWarning
                  dir="ltr"
                  className={`outline-none block whitespace-pre-wrap font-mono text-sm leading-relaxed ${blockStyles}`}
                  data-placeholder={placeholder}
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                  onFocus={onFocus}
                  onPaste={handlePaste}
                  data-testid={`input-block-${index}`}
                />
              </pre>
            </div>
          )}
          {block.type === "quote" && (
            <div className={`border-l-[3px] border-foreground/20 pl-4 ${alignClass}`}>
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                dir="ltr"
                className={`outline-none ${blockStyles}`}
                data-placeholder={placeholder}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={onFocus}
                onPaste={handlePaste}
                data-testid={`input-block-${index}`}
              />
            </div>
          )}
          {block.type === "bulleted-list" && (
            <div className={`flex items-start gap-2 ${alignClass}`}>
              <span className="select-none text-foreground/50 mt-[2px] text-lg leading-[1.625]">•</span>
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                dir="ltr"
                className={`flex-1 outline-none ${blockStyles}`}
                data-placeholder={placeholder}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={onFocus}
                onPaste={handlePaste}
                data-testid={`input-block-${index}`}
              />
            </div>
          )}
          {block.type === "numbered-list" && (
            <div className={`flex items-start gap-2 ${alignClass}`}>
              <span className="select-none text-foreground/50 mt-[1px] text-base leading-[1.625] min-w-[1.2em] text-right tabular-nums">{listIndex || 1}.</span>
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                dir="ltr"
                className={`flex-1 outline-none ${blockStyles}`}
                data-placeholder={placeholder}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={onFocus}
                onPaste={handlePaste}
                data-testid={`input-block-${index}`}
              />
            </div>
          )}
          {!["callout", "code", "quote", "bulleted-list", "numbered-list"].includes(block.type) && (
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              dir="ltr"
              className={`outline-none ${blockStyles} ${alignClass}`}
              data-placeholder={placeholder}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              onPaste={handlePaste}
              data-testid={`input-block-${index}`}
            />
          )}
        </div>
      </div>
    );
  },
);

BlockItem.displayName = "BlockItem";

function BlockControls({
  isVisible,
  onAddBlock,
  onDeleteBlock,
  onChangeType,
  onDragStart,
  onDragEnd,
  blockType,
  currentAlign,
  onAlignChange,
}: {
  isVisible: boolean;
  onAddBlock: () => void;
  onDeleteBlock: () => void;
  onChangeType: (type: Block["type"]) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  blockType: Block["type"];
  currentAlign?: string;
  onAlignChange?: (align: string) => void;
}) {
  const controlsTop = (() => {
    switch (blockType) {
      case "heading1": return "top-[35px]";
      case "heading2": return "top-[27px]";
      case "heading3": return "top-[19px]";
      case "code": return "top-[11px]";
      case "quote": return "top-[15px]";
      case "callout": return "top-[11px]";
      default: return "top-[3px]";
    }
  })();

  return (
    <div
      className={`absolute ${controlsTop} -left-[52px] flex items-center gap-0.5`}
      style={{ visibility: isVisible ? "visible" : "hidden" }}
    >
      <button
        className="w-6 h-6 flex items-center justify-center rounded-sm text-muted-foreground/60 transition-colors duration-150 hover-elevate"
        onClick={onAddBlock}
        data-testid="button-add-block"
        title="Add block below"
      >
        <Plus className="w-4 h-4" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-6 h-6 flex items-center justify-center rounded-sm text-muted-foreground/60 cursor-grab active:cursor-grabbing transition-colors duration-150 hover-elevate"
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            data-testid="button-drag-handle"
            title="Drag to reorder / Click for options"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onClick={onDeleteBlock} className="text-destructive" data-testid="menu-delete-block">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {onAlignChange && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Alignment</div>
              <div className="flex items-center gap-1 px-2 pb-1.5">
                {([
                  { value: "left", icon: AlignLeft, label: "Left" },
                  { value: "center", icon: AlignCenter, label: "Center" },
                  { value: "right", icon: AlignRight, label: "Right" },
                ] as const).map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => onAlignChange(value)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-100 ${
                      (currentAlign || "left") === value
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover-elevate"
                    }`}
                    title={label}
                    data-testid={`menu-align-${value}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Turn into</div>
          {(Object.keys(blockTypeLabels) as Block["type"][]).map((type) => {
            const Icon = blockTypeIcons[type];
            return (
              <DropdownMenuItem
                key={type}
                onClick={() => onChangeType(type)}
                className={blockType === type ? "bg-accent" : ""}
                data-testid={`menu-type-${type}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {blockTypeLabels[type]}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function getBlockStyles(type: Block["type"]): string {
  switch (type) {
    case "heading1":
      return "text-[32px] font-bold leading-tight tracking-tight";
    case "heading2":
      return "text-2xl font-semibold leading-snug tracking-tight";
    case "heading3":
      return "text-xl font-semibold leading-snug";
    case "code":
      return "text-foreground/90";
    case "quote":
      return "text-lg italic text-foreground/80 leading-relaxed";
    case "callout":
      return "text-base leading-relaxed";
    default:
      return "text-base leading-[1.625]";
  }
}

function getWrapperStyles(type: Block["type"]): string {
  switch (type) {
    case "heading1":
      return "mt-8 mb-1";
    case "heading2":
      return "mt-6 mb-1";
    case "heading3":
      return "mt-4 mb-1";
    case "code":
      return "my-2";
    case "quote":
      return "my-3";
    case "callout":
      return "my-2";
    default:
      return "py-[3px]";
  }
}

function getPlaceholder(type: Block["type"], index: number): string {
  switch (type) {
    case "heading1":
      return "Heading 1";
    case "heading2":
      return "Heading 2";
    case "heading3":
      return "Heading 3";
    case "bulleted-list":
      return "List item";
    case "numbered-list":
      return "List item";
    case "code":
      return "Write code...";
    case "quote":
      return "Quote";
    case "callout":
      return "Type something...";
    default:
      return index === 0 ? "Type '/' for commands..." : "";
  }
}

function getAlignClass(align?: string): string {
  switch (align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    default:
      return "text-left";
  }
}
