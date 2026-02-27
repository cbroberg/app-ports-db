"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { App } from "@/drizzle/schema";

interface Props {
  app: App;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReadmeViewer({ app, open, onOpenChange }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setContent(null);
    setError(null);
    fetch(`/api/apps/${app.id}/readme`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setContent(d.content);
      })
      .catch(() => setError("Failed to load README"));
  }, [open, app.id]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[680px] sm:max-w-[680px] flex flex-col p-0 gap-0 border-l border-border"
      >
        {/* Header */}
        <SheetHeader className="flex-row items-center justify-between px-4 py-3 border-b border-border/50 space-y-0 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <SheetTitle className="text-sm font-mono font-medium truncate">
              {app.name} — README.md
            </SheetTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6" style={{ scrollbarWidth: "thin" }}>
          {error ? (
            <p className="text-sm text-muted-foreground">{error}</p>
          ) : content === null ? (
            <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm dark:prose-invert max-w-none"
              components={{
                h1: ({ children }) => <h1 className="text-xl font-bold mt-0 mb-4 pb-2 border-b border-border">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold mt-6 mb-3 pb-1 border-b border-border/50">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="text-sm leading-relaxed mb-3 text-foreground/90">{children}</p>,
                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes("language-");
                  return isBlock
                    ? <code className="block bg-muted/60 rounded px-3 py-2 text-xs font-mono overflow-x-auto my-2">{children}</code>
                    : <code className="bg-muted/60 rounded px-1 py-0.5 text-xs font-mono">{children}</code>;
                },
                pre: ({ children }) => <pre className="bg-muted/60 rounded-md p-3 overflow-x-auto my-3 text-xs">{children}</pre>,
                ul: ({ children }) => <ul className="list-disc list-outside pl-5 mb-3 space-y-1 text-sm">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside pl-5 mb-3 space-y-1 text-sm">{children}</ol>,
                li: ({ children }) => <li className="text-foreground/90">{children}</li>,
                table: ({ children }) => <div className="overflow-x-auto my-3"><table className="w-full text-xs border-collapse">{children}</table></div>,
                th: ({ children }) => <th className="text-left px-3 py-1.5 border border-border bg-muted/40 font-medium">{children}</th>,
                td: ({ children }) => <td className="px-3 py-1.5 border border-border">{children}</td>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/50 pl-4 italic text-muted-foreground my-3">{children}</blockquote>,
                hr: () => <hr className="border-border my-4" />,
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
