"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Copy, Check } from "lucide-react";

export function VacantPortBadge() {
  const [ports, setPorts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPort, setCopiedPort] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/vacant-port")
      .then((r) => r.json())
      .then((data) => setPorts(data.ports ?? [data.port]))
      .finally(() => setLoading(false));
  }, []);

  function copyPort(port: number) {
    navigator.clipboard.writeText(String(port));
    setCopiedPort(port);
    setTimeout(() => setCopiedPort(null), 1500);
  }

  if (loading) {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Finding port...
      </Badge>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          variant="secondary"
          className="text-sm font-mono cursor-pointer hover:bg-secondary/80 transition-colors select-none"
        >
          Next available: :{ports[0]}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <p className="text-xs text-muted-foreground px-2 pb-1">Next 5 available ports</p>
        <div className="flex flex-col">
          {ports.map((port) => (
            <button
              key={port}
              onClick={() => copyPort(port)}
              className="flex items-center justify-between px-2 py-1.5 rounded text-sm font-mono hover:bg-muted transition-colors"
            >
              <span>:{port}</span>
              {copiedPort === port ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
