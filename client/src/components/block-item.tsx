import { forwardRef, useRef, useCallback, useState, useEffect } from "react";
import type { Block } from "@shared/schema";
import { GripVertical, Plus, Trash2, Type, Heading1, Heading2, Heading3, List, ListOrdered, Code2, Quote, Minus, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface BlockItemProps {
  block: Block;
  index: number;
  listIndex?: number;
  isFocused: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onFocus: () => void;
  onChange: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSlashCommand: (position: { x: number; y: number }) => void;
  onSlashFilter: (filter: string) => void;
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
};

export const BlockItem = forwardRef<HTMLDivElement, BlockItemProps>(
  (
    {
      block,
      index,
      listIndex,
      isFocused,
      isDragging,
      isDragOver,
      onFocus,
      onChange,
      onKeyDown,
      onSlashCommand,
      onSlashFilter,
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
      if (contentRef.current && block.type !== "divider") {
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
    }, [onChange, onSlashCommand, onSlashFilter]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Tab") {
          e.preventDefault();
          if (block.type === "code" && contentRef.current) {
            document.execCommand("insertText", false, "  ");
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

    if (block.type === "divider") {
      return (
        <div
          ref={ref}
          data-block-id={block.id}
          className={`group relative flex items-center py-2 ${isDragOver ? "border-t-2 border-blue-400" : ""} ${isDragging ? "opacity-30" : ""}`}
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
          <div className="flex-1 ml-1">
            <hr className="border-t border-border" />
          </div>
        </div>
      );
    }

    const blockStyles = getBlockStyles(block.type);
    const placeholder = getPlaceholder(block.type, index);

    return (
      <div
        ref={ref}
        data-block-id={block.id}
        className={`group relative flex items-start ${isDragOver ? "border-t-2 border-blue-400" : ""} ${isDragging ? "opacity-30" : ""}`}
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
        />
        <div className={`flex-1 min-w-0 ${getWrapperStyles(block.type)}`}>
          {block.type === "callout" && (
            <div className="flex items-start gap-3 p-4 rounded-md bg-accent/50">
              <span className="text-xl mt-0.5 select-none">💡</span>
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
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
              <pre className="bg-[#F7F6F3] dark:bg-[#1e1e1e] p-4 rounded-md overflow-x-auto">
                <code
                  ref={contentRef}
                  contentEditable
                  suppressContentEditableWarning
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
            <div className="border-l-[3px] border-foreground/20 pl-4">
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
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
            <div className="flex items-start gap-2">
              <span className="select-none text-foreground/50 mt-[2px] text-lg leading-[1.625]">•</span>
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
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
            <div className="flex items-start gap-2">
              <span className="select-none text-foreground/50 mt-[1px] text-base leading-[1.625] min-w-[1.2em] text-right tabular-nums">{listIndex || 1}.</span>
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
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
              className={`outline-none ${blockStyles}`}
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
}: {
  isVisible: boolean;
  onAddBlock: () => void;
  onDeleteBlock: () => void;
  onChangeType: (type: Block["type"]) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  blockType: Block["type"];
}) {
  return (
    <div
      className="flex items-center gap-0.5 mr-1 pt-[3px] shrink-0"
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
      return index === 0 ? "Type '/' for commands..." : "Type '/' for commands...";
  }
}
