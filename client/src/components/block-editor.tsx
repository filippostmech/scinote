import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { Block } from "@shared/schema";
import { BlockItem } from "./block-item";
import { SlashCommandMenu } from "./slash-command-menu";
import { InlineToolbar } from "./inline-toolbar";

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function createBlock(type: Block["type"] = "text", content = ""): Block {
  return { id: generateId(), type, content };
}

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export function BlockEditor({ blocks: initialBlocks, onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks.length > 0 ? initialBlocks : [createBlock()]
  );
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [slashMenu, setSlashMenu] = useState<{
    blockId: string;
    position: { x: number; y: number };
    filter: string;
  } | null>(null);
  const [inlineToolbar, setInlineToolbar] = useState<{
    position: { x: number; y: number };
    blockId: string;
  } | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const editorRef = useRef<HTMLDivElement>(null);
  const initialBlocksRef = useRef(initialBlocks);

  useEffect(() => {
    if (JSON.stringify(initialBlocks) !== JSON.stringify(initialBlocksRef.current)) {
      initialBlocksRef.current = initialBlocks;
      if (initialBlocks.length > 0) {
        setBlocks(initialBlocks);
      }
    }
  }, [initialBlocks]);

  const updateBlocks = useCallback(
    (newBlocks: Block[]) => {
      setBlocks(newBlocks);
      onChange(newBlocks);
    },
    [onChange],
  );

  const focusBlock = useCallback((blockId: string, position: "start" | "end" = "end") => {
    setTimeout(() => {
      const el = blockRefs.current.get(blockId);
      if (!el) return;
      const contentEl = el.querySelector("[contenteditable]") as HTMLElement;
      if (!contentEl) return;
      contentEl.focus();
      if (position === "end" && contentEl.textContent) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(contentEl);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      } else if (position === "start") {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(contentEl);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 10);
  }, []);

  const handleBlockChange = useCallback(
    (blockId: string, content: string) => {
      const newBlocks = blocks.map((b) =>
        b.id === blockId ? { ...b, content } : b,
      );
      updateBlocks(newBlocks);

      if (slashMenu && slashMenu.blockId === blockId) {
        const textContent = content.replace(/<[^>]*>/g, "");
        if (!textContent.includes("/")) {
          setSlashMenu(null);
        }
      }
    },
    [blocks, updateBlocks, slashMenu],
  );

  const handleKeyDown = useCallback(
    (blockId: string, e: React.KeyboardEvent) => {
      const blockIndex = blocks.findIndex((b) => b.id === blockId);
      const block = blocks[blockIndex];

      if (e.key === "Enter" && !e.shiftKey) {
        if (slashMenu) return;
        e.preventDefault();
        const newBlock = createBlock();
        const newBlocks = [...blocks];
        newBlocks.splice(blockIndex + 1, 0, newBlock);
        updateBlocks(newBlocks);
        focusBlock(newBlock.id, "start");
      }

      if (e.key === "Backspace" && !block.content && blocks.length > 1) {
        e.preventDefault();
        if (block.type !== "text") {
          const newBlocks = blocks.map((b) =>
            b.id === blockId ? { ...b, type: "text" as const } : b,
          );
          updateBlocks(newBlocks);
          return;
        }
        const newBlocks = blocks.filter((b) => b.id !== blockId);
        updateBlocks(newBlocks);
        if (blockIndex > 0) {
          focusBlock(blocks[blockIndex - 1].id, "end");
        }
      }

      if (e.key === "ArrowUp" && blockIndex > 0) {
        const contentEl = e.target as HTMLElement;
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rects = range.getClientRects();
          const containerRect = contentEl.getBoundingClientRect();
          if (rects.length === 0 || rects[0].top <= containerRect.top + 2) {
            e.preventDefault();
            focusBlock(blocks[blockIndex - 1].id, "end");
          }
        }
      }

      if (e.key === "ArrowDown" && blockIndex < blocks.length - 1) {
        const contentEl = e.target as HTMLElement;
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rects = range.getClientRects();
          const containerRect = contentEl.getBoundingClientRect();
          if (
            rects.length === 0 ||
            rects[rects.length - 1].bottom >= containerRect.bottom - 2
          ) {
            e.preventDefault();
            focusBlock(blocks[blockIndex + 1].id, "start");
          }
        }
      }
    },
    [blocks, updateBlocks, focusBlock, slashMenu],
  );

  const handleSlashCommand = useCallback(
    (blockId: string, position: { x: number; y: number }) => {
      setSlashMenu({ blockId, position, filter: "" });
    },
    [],
  );

  const handleSlashFilter = useCallback(
    (filter: string) => {
      if (slashMenu) {
        setSlashMenu({ ...slashMenu, filter });
      }
    },
    [slashMenu],
  );

  const handleSlashSelect = useCallback(
    (type: Block["type"]) => {
      if (!slashMenu) return;
      const newBlocks = blocks.map((b) => {
        if (b.id === slashMenu.blockId) {
          const cleanContent = b.content.replace(/\/[^\s]*$/, "").trim();
          return { ...b, type, content: type === "divider" ? "" : cleanContent };
        }
        return b;
      });
      updateBlocks(newBlocks);
      setSlashMenu(null);
      if (type !== "divider") {
        focusBlock(slashMenu.blockId, "start");
      }
    },
    [slashMenu, blocks, updateBlocks, focusBlock],
  );

  const handleSlashClose = useCallback(() => {
    setSlashMenu(null);
  }, []);

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setInlineToolbar(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const container = editorRef.current;
    if (!container) return;

    const editorEl = range.commonAncestorContainer as HTMLElement;
    const blockEl = editorEl.closest?.("[data-block-id]") ||
      (editorEl.parentElement?.closest?.("[data-block-id]"));
    if (!blockEl) {
      setInlineToolbar(null);
      return;
    }

    const blockId = (blockEl as HTMLElement).dataset.blockId;
    if (!blockId) return;

    const containerRect = container.getBoundingClientRect();
    setInlineToolbar({
      position: {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top - containerRect.top - 8,
      },
      blockId,
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  const handleDragStart = useCallback((blockId: string) => {
    setDraggedBlockId(blockId);
  }, []);

  const handleDragOver = useCallback(
    (blockId: string, e: React.DragEvent) => {
      e.preventDefault();
      if (blockId !== draggedBlockId) {
        setDragOverBlockId(blockId);
      }
    },
    [draggedBlockId],
  );

  const handleDrop = useCallback(
    (targetBlockId: string) => {
      if (!draggedBlockId || draggedBlockId === targetBlockId) {
        setDraggedBlockId(null);
        setDragOverBlockId(null);
        return;
      }
      const draggedIndex = blocks.findIndex((b) => b.id === draggedBlockId);
      const targetIndex = blocks.findIndex((b) => b.id === targetBlockId);
      const newBlocks = [...blocks];
      const [removed] = newBlocks.splice(draggedIndex, 1);
      newBlocks.splice(targetIndex, 0, removed);
      updateBlocks(newBlocks);
      setDraggedBlockId(null);
      setDragOverBlockId(null);
    },
    [draggedBlockId, blocks, updateBlocks],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedBlockId(null);
    setDragOverBlockId(null);
  }, []);

  const handleAddBlock = useCallback(
    (afterBlockId: string) => {
      const index = blocks.findIndex((b) => b.id === afterBlockId);
      const newBlock = createBlock();
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      updateBlocks(newBlocks);
      focusBlock(newBlock.id, "start");
    },
    [blocks, updateBlocks, focusBlock],
  );

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      if (blocks.length <= 1) return;
      const index = blocks.findIndex((b) => b.id === blockId);
      const newBlocks = blocks.filter((b) => b.id !== blockId);
      updateBlocks(newBlocks);
      if (index > 0) {
        focusBlock(newBlocks[index - 1].id, "end");
      } else if (newBlocks.length > 0) {
        focusBlock(newBlocks[0].id, "start");
      }
    },
    [blocks, updateBlocks, focusBlock],
  );

  const handleChangeType = useCallback(
    (blockId: string, type: Block["type"]) => {
      const newBlocks = blocks.map((b) =>
        b.id === blockId ? { ...b, type } : b,
      );
      updateBlocks(newBlocks);
      focusBlock(blockId, "end");
    },
    [blocks, updateBlocks, focusBlock],
  );

  const listIndices = useMemo(() => {
    const indices = new Map<string, number>();
    let counter = 0;
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].type === "numbered-list") {
        if (i === 0 || blocks[i - 1].type !== "numbered-list") {
          counter = 1;
        } else {
          counter++;
        }
        indices.set(blocks[i].id, counter);
      }
    }
    return indices;
  }, [blocks]);

  return (
    <div ref={editorRef} className="relative" data-testid="block-editor">
      {blocks.map((block, index) => (
        <BlockItem
          key={block.id}
          block={block}
          index={index}
          listIndex={listIndices.get(block.id)}
          isFocused={focusedBlockId === block.id}
          isDragging={draggedBlockId === block.id}
          isDragOver={dragOverBlockId === block.id}
          onFocus={() => setFocusedBlockId(block.id)}
          onChange={(content) => handleBlockChange(block.id, content)}
          onKeyDown={(e) => handleKeyDown(block.id, e)}
          onSlashCommand={(pos) => handleSlashCommand(block.id, pos)}
          onSlashFilter={handleSlashFilter}
          onAddBlock={() => handleAddBlock(block.id)}
          onDeleteBlock={() => handleDeleteBlock(block.id)}
          onChangeType={(type) => handleChangeType(block.id, type)}
          onDragStart={() => handleDragStart(block.id)}
          onDragOver={(e) => handleDragOver(block.id, e)}
          onDrop={() => handleDrop(block.id)}
          onDragEnd={handleDragEnd}
          ref={(el: HTMLDivElement | null) => {
            if (el) blockRefs.current.set(block.id, el);
            else blockRefs.current.delete(block.id);
          }}
        />
      ))}

      {slashMenu && (
        <SlashCommandMenu
          position={slashMenu.position}
          filter={slashMenu.filter}
          onSelect={handleSlashSelect}
          onClose={handleSlashClose}
        />
      )}

      {inlineToolbar && (
        <InlineToolbar
          position={inlineToolbar.position}
          blockId={inlineToolbar.blockId}
        />
      )}
    </div>
  );
}
