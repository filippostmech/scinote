import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import type { Document, Block } from "@shared/schema";
import { BlockEditor } from "@/components/block-editor";
import { Loader2 } from "lucide-react";

export default function EditorPage() {
  const [, params] = useRoute("/doc/:id");
  const docId = params?.id;

  const { data: doc, isLoading } = useQuery<Document>({
    queryKey: ["/api/documents", docId],
    enabled: !!docId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { title?: string; blocks?: Block[] }) => {
      const res = await apiRequest("PATCH", `/api/documents/${docId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBlocksChange = useCallback(
    (blocks: Block[]) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        updateMutation.mutate({ blocks });
      }, 800);
    },
    [updateMutation],
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        updateMutation.mutate({ title });
      }, 800);
    },
    [updateMutation],
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-editor">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="empty-editor">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">Select a document or create a new one</p>
        </div>
      </div>
    );
  }

  const blocks = (doc.blocks as Block[]) || [];

  return (
    <div className="h-full overflow-y-auto" data-testid="editor-page">
      <div className="max-w-[900px] mx-auto px-6 py-12 md:px-16">
        <TitleInput
          value={doc.title}
          onChange={handleTitleChange}
          icon={doc.icon}
        />
        <BlockEditor
          blocks={blocks}
          onChange={handleBlocksChange}
        />
        <div className="h-[40vh]" />
      </div>
    </div>
  );
}

function TitleInput({
  value,
  onChange,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  icon?: string | null;
}) {
  const [localValue, setLocalValue] = useState(value === "Untitled" ? "" : value);

  useEffect(() => {
    setLocalValue(value === "Untitled" ? "" : value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setLocalValue(text);
    onChange(text || "Untitled");
  };

  return (
    <div className="mb-2">
      {icon && <span className="text-5xl mb-4 block" data-testid="doc-icon">{icon}</span>}
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder="Untitled"
        dir="ltr"
        className="w-full text-[40px] font-bold leading-tight outline-none text-foreground bg-transparent placeholder:text-muted-foreground/40 border-none p-0"
        style={{ fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}
        data-testid="input-title"
      />
    </div>
  );
}
