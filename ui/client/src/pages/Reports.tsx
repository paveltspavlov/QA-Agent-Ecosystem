import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, Search, ChevronRight, ChevronDown, File, FolderOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ReportFile {
  path: string;
  name: string;
  agent: string;
  sizeBytes: number;
  modifiedAt: string;
  ext: string;
}

interface ReportGroup {
  agent: string;
  files: ReportFile[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatAgentName(name: string): string {
  return name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function MarkdownPreview({ content }: { content: string }) {
  // Very simple markdown rendering — links, headings, bullets
  const lines = content.split("\n");
  return (
    <div className="markdown-preview text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i}>{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i}>{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i}>{line.slice(4)}</h3>;
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return <li key={i}>{line.slice(2)}</li>;
        }
        if (line.startsWith("```")) return null;
        if (line === "") return <br key={i} />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

export default function Reports() {
  const [search, setSearch] = useState("");
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<ReportFile | null>(null);

  const { data: groups = [], isLoading } = useQuery<ReportGroup[]>({
    queryKey: ["/api/reports"],
    queryFn: () => apiRequest("GET", "/api/reports").then((r) => r.json()),
    refetchInterval: 10000,
  });

  const { data: fileContent, isLoading: contentLoading } = useQuery<{ content: string; ext: string }>({
    queryKey: ["/api/reports/content", selectedFile?.path],
    queryFn: () =>
      apiRequest("GET", `/api/reports/content?path=${encodeURIComponent(selectedFile!.path)}`).then(
        (r) => r.json()
      ),
    enabled: !!selectedFile,
  });

  function toggleAgent(agent: string) {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agent)) next.delete(agent);
      else next.add(agent);
      return next;
    });
  }

  function handleDownload(file: ReportFile) {
    const API_BASE = (window as any).__PORT_5000__ || "";
    window.open(`${API_BASE}/api/reports/download?path=${encodeURIComponent(file.path)}`, "_blank");
  }

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      files: g.files.filter(
        (f) =>
          !search ||
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.agent.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((g) => g.files.length > 0);

  const totalFiles = groups.reduce((sum, g) => sum + g.files.length, 0);

  return (
    <div className="flex h-full" style={{ height: "calc(100vh - 3rem)" }}>
      {/* Left panel: File browser */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold">Reports</h1>
            <span className="text-xs text-muted-foreground">{totalFiles} files</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
              data-testid="input-filter-reports"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-xs text-muted-foreground">No reports yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Run agents or workflows to generate reports
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredGroups.map((group) => (
                <div key={group.agent}>
                  <button
                    className="flex w-full items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-muted/50 text-left transition-colors group"
                    onClick={() => toggleAgent(group.agent)}
                    data-testid={`button-expand-agent-${group.agent}`}
                  >
                    {expandedAgents.has(group.agent) ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <FolderOpen className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-medium truncate flex-1 text-foreground">
                      {formatAgentName(group.agent)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {group.files.length}
                    </span>
                  </button>

                  {expandedAgents.has(group.agent) && (
                    <div className="ml-4 space-y-0.5 mt-0.5">
                      {group.files.map((file) => (
                        <button
                          key={file.path}
                          className={cn(
                            "flex w-full items-center gap-1.5 px-2 py-1.5 rounded-md text-left transition-colors",
                            selectedFile?.path === file.path
                              ? "bg-primary/15 text-primary"
                              : "hover:bg-muted/50 text-foreground"
                          )}
                          onClick={() => setSelectedFile(file)}
                          data-testid={`button-select-file-${file.name}`}
                        >
                          <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs truncate">{file.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatBytes(file.sizeBytes)} ·{" "}
                              {formatDistanceToNow(new Date(file.modifiedAt), { addSuffix: true })}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right panel: Preview */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedFile ? (
          <>
            {/* Preview toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/50">
              <div className="flex items-center gap-2 min-w-0">
                <File className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatAgentName(selectedFile.agent)} · {formatBytes(selectedFile.sizeBytes)} ·{" "}
                    {formatDistanceToNow(new Date(selectedFile.modifiedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(selectedFile)}
                data-testid="button-download-report"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download
              </Button>
            </div>

            {/* Preview content */}
            <ScrollArea className="flex-1 p-6">
              {contentLoading ? (
                <div className="space-y-3 max-w-3xl">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : fileContent ? (
                <div className="max-w-3xl">
                  {fileContent.ext === ".md" ? (
                    <MarkdownPreview content={fileContent.content} />
                  ) : fileContent.ext === ".html" ? (
                    <div className="border border-border rounded-md overflow-hidden">
                      <iframe
                        srcDoc={fileContent.content}
                        className="w-full"
                        style={{ minHeight: 600 }}
                        title="Report preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  ) : (
                    <pre className="terminal-output p-4 rounded-md bg-[#0d1117] border border-[#30363d] overflow-x-auto whitespace-pre-wrap text-xs">
                      {fileContent.content}
                    </pre>
                  )}
                </div>
              ) : null}
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Select a report to preview</p>
              <p className="text-xs mt-1">
                Browse files in the left panel and click to preview
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
