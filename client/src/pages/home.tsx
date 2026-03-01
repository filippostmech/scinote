import { FlaskConical, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Document } from "@shared/schema";

export default function HomePage() {
  const [, setLocation] = useLocation();

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/documents", {
        title: "Untitled",
        blocks: [{ id: Math.random().toString(36).substr(2, 9), type: "text", content: "" }],
      });
      return res.json();
    },
    onSuccess: (doc: Document) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setLocation(`/doc/${doc.id}`);
    },
  });

  return (
    <div className="h-full flex items-center justify-center" data-testid="home-page">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2EAADC] to-[#2EAADC]/70 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <FlaskConical className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Welcome to SciNote</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
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
        <p className="text-xs text-muted-foreground/60 mt-4">
          Or select a document from the sidebar
        </p>
      </div>
    </div>
  );
}
