import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { Block } from "@shared/schema";
import { BlockItem } from "./block-item";
import { SlashCommandMenu } from "./slash-command-menu";
import { InlineToolbar } from "./inline-toolbar";

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function createBlock(type: Block["type"] = "text", content = "", meta?: Record<string, any>): Block {
  return { id: generateId(), type, content, meta: { align: "left" as const, ...meta } };
}

const MAX_HISTORY = 50;

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
  const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const editorRef = useRef<HTMLDivElement>(null);
  const initialBlocksRef = useRef(initialBlocks);

  const historyRef = useRef<Block[][]>([]);
  const futureRef = useRef<Block[][]>([]);
  const isUndoRedoRef = useRef(false);
  const slashMenuOpenRef = useRef(false);

  useEffect(() => {
    slashMenuOpenRef.current = slashMenu !== null;
  }, [slashMenu]);

  useEffect(() => {
    if (JSON.stringify(initialBlocks) !== JSON.stringify(initialBlocksRef.current)) {
      initialBlocksRef.current = initialBlocks;
      if (initialBlocks.length > 0) {
        setBlocks(initialBlocks);
      }
    }
  }, [initialBlocks]);

  const pushHistory = useCallback((prevBlocks: Block[]) => {
    if (isUndoRedoRef.current) return;
    historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), prevBlocks];
    futureRef.current = [];
  }, []);

  const updateBlocks = useCallback(
    (newBlocks: Block[]) => {
      pushHistory(blocks);
      setBlocks(newBlocks);
      onChange(newBlocks);
    },
    [onChange, blocks, pushHistory],
  );

  const contentSnapshotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSnapshotRef = useRef<string>("");

  const updateBlocksSilent = useCallback(
    (newBlocks: Block[]) => {
      setBlocks(newBlocks);
      onChange(newBlocks);

      if (contentSnapshotTimer.current) {
        clearTimeout(contentSnapshotTimer.current);
      }
      contentSnapshotTimer.current = setTimeout(() => {
        const snapshot = JSON.stringify(newBlocks);
        if (snapshot !== lastSnapshotRef.current) {
          lastSnapshotRef.current = snapshot;
          historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), newBlocks];
          futureRef.current = [];
        }
      }, 500);
    },
    [onChange],
  );

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    isUndoRedoRef.current = true;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, blocks];
    setBlocks(prev);
    onChange(prev);
    isUndoRedoRef.current = false;
  }, [blocks, onChange]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    isUndoRedoRef.current = true;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    historyRef.current = [...historyRef.current, blocks];
    setBlocks(next);
    onChange(next);
    isUndoRedoRef.current = false;
  }, [blocks, onChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [undo, redo]);

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
      updateBlocksSilent(newBlocks);

      if (slashMenu && slashMenu.blockId === blockId) {
        const textContent = content.replace(/<[^>]*>/g, "");
        if (!textContent.includes("/")) {
          setSlashMenu(null);
        }
      }
    },
    [blocks, updateBlocksSilent, slashMenu],
  );

  const handleBlockMetaChange = useCallback(
    (blockId: string, meta: Record<string, any>) => {
      const newBlocks = blocks.map((b) =>
        b.id === blockId ? { ...b, meta } : b,
      );
      updateBlocksSilent(newBlocks);
    },
    [blocks, updateBlocksSilent],
  );

  const handleMarkdownShortcut = useCallback(
    (blockId: string, type: Block["type"], content: string) => {
      pushHistory(blocks);
      const newBlocks = blocks.map((b) =>
        b.id === blockId ? { ...b, type, content } : b,
      );
      setBlocks(newBlocks);
      onChange(newBlocks);
      focusBlock(blockId, "start");
    },
    [blocks, onChange, focusBlock, pushHistory],
  );

  const handleKeyDown = useCallback(
    (blockId: string, e: React.KeyboardEvent) => {
      const blockIndex = blocks.findIndex((b) => b.id === blockId);
      const block = blocks[blockIndex];

      if (e.key === "Enter" && !e.shiftKey) {
        if (slashMenu || slashMenuOpenRef.current) return;
        e.preventDefault();

        const listTypes: Block["type"][] = ["bulleted-list", "numbered-list"];
        if (listTypes.includes(block.type) && !block.content.replace(/<[^>]*>/g, "").trim()) {
          const newBlocks = blocks.map((b) =>
            b.id === blockId ? { ...b, type: "text" as const, content: "" } : b,
          );
          updateBlocks(newBlocks);
          focusBlock(blockId, "start");
          return;
        }

        const newBlockType = listTypes.includes(block.type) ? block.type : "text";
        const newBlock = createBlock(newBlockType);
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
      slashMenuOpenRef.current = true;
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
      pushHistory(blocks);
      const blockWrapper = document.querySelector(`[data-block-id="${slashMenu.blockId}"]`) as HTMLElement | null;
      const editableEl = blockWrapper?.querySelector("[contenteditable]") as HTMLElement | null;
      const plainText = editableEl ? (editableEl.innerText ?? editableEl.textContent ?? "") : "";
      const slashAndFilter = "/" + slashMenu.filter;
      const lastSlashIdx = plainText.lastIndexOf(slashAndFilter);
      const cleanContent = lastSlashIdx >= 0
        ? plainText.slice(0, lastSlashIdx).trimEnd()
        : plainText.replace(/\/[^\s]*$/, "").trimEnd();
      if (editableEl && type !== "divider" && type !== "table" && type !== "image") {
        editableEl.innerHTML = cleanContent;
      }
      const newBlocks = blocks.map((b) => {
        if (b.id === slashMenu.blockId) {
          if (type === "table") {
            return { ...b, type, content: "", meta: { tableData: [["", "", ""], ["", "", ""], ["", "", ""]] } };
          }
          if (type === "image") {
            return { ...b, type, content: "", meta: {} };
          }
          return { ...b, type, content: type === "divider" ? "" : cleanContent };
        }
        return b;
      });
      setBlocks(newBlocks);
      onChange(newBlocks);
      setSlashMenu(null);
      if (type !== "divider" && type !== "table" && type !== "image") {
        focusBlock(slashMenu.blockId, "start");
      }
    },
    [slashMenu, blocks, onChange, focusBlock, pushHistory],
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
        const el = blockRefs.current.get(blockId);
        if (el) {
          const rect = el.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          setDropPosition(e.clientY < midY ? "above" : "below");
        }
      }
    },
    [draggedBlockId],
  );

  const handleDrop = useCallback(
    (targetBlockId: string) => {
      if (!draggedBlockId || draggedBlockId === targetBlockId) {
        setDraggedBlockId(null);
        setDragOverBlockId(null);
        setDropPosition(null);
        return;
      }
      const draggedIndex = blocks.findIndex((b) => b.id === draggedBlockId);
      let targetIndex = blocks.findIndex((b) => b.id === targetBlockId);
      const newBlocks = [...blocks];
      const [removed] = newBlocks.splice(draggedIndex, 1);
      if (dropPosition === "below") {
        targetIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
      } else {
        targetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
      }
      newBlocks.splice(targetIndex, 0, removed);
      updateBlocks(newBlocks);
      setDraggedBlockId(null);
      setDragOverBlockId(null);
      setDropPosition(null);
    },
    [draggedBlockId, blocks, updateBlocks, dropPosition],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedBlockId(null);
    setDragOverBlockId(null);
    setDropPosition(null);
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
          dropPosition={dragOverBlockId === block.id ? dropPosition : null}
          onFocus={() => setFocusedBlockId(block.id)}
          onChange={(content) => handleBlockChange(block.id, content)}
          onMetaChange={(meta) => handleBlockMetaChange(block.id, meta)}
          onKeyDown={(e) => handleKeyDown(block.id, e)}
          onSlashCommand={(pos) => handleSlashCommand(block.id, pos)}
          onSlashFilter={handleSlashFilter}
          onMarkdownShortcut={(type, content) => handleMarkdownShortcut(block.id, type, content)}
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
          currentAlign={blocks.find((b) => b.id === inlineToolbar.blockId)?.meta?.align || "left"}
          onAlignChange={(align: string) => {
            const block = blocks.find((b) => b.id === inlineToolbar.blockId);
            if (block) {
              handleBlockMetaChange(inlineToolbar.blockId, { ...block.meta, align });
            }
          }}
        />
      )}
    </div>
  );
}
