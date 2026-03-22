import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Play,
  Plus,
  Save,
  Search,
  Square,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useAddPipeline,
  useGetAllPipelines,
  useResetToDefault,
  useUpdatePipeline,
} from "./hooks/useQueries";

// ---- types ----
interface PipelineItem {
  imageUrl: string;
  prompt: string;
}

type ResultStatus = "idle" | "processing" | "done" | "error";

interface PipelineResult {
  status: ResultStatus;
  outputSrc: string | null;
  progress: number;
  error: string | null;
}

interface Settings {
  guidanceScale: number;
  steps: number;
  strength: number;
}

// ---- Puter type shim ----
declare global {
  interface Window {
    puter?: {
      ai: {
        img2img?: (
          imageUrl: string | Blob,
          prompt: string,
          testMode: boolean,
          opts: { model: string },
        ) => Promise<Blob | { src: string } | HTMLImageElement>;
        txt2img: (
          prompt: string,
          testMode: boolean,
          opts: { model: string },
        ) => Promise<HTMLImageElement | Blob>;
      };
    };
  }
}

// ---- defaults ----
const SECRET_SUFFIX =
  ", keep walls floors ceiling windows doors and all architectural elements completely unchanged, preserve room structure";

const DEFAULT_ITEMS: PipelineItem[] = [
  {
    imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
    prompt: "modern furnished living room",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae",
    prompt: "luxury bedroom interior",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1493666438817-866a91353ca9",
    prompt: "minimalist room design",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1484154218962-a197022b5858",
    prompt: "vintage style furniture room",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6",
    prompt: "cozy room with plants",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
    prompt: "futuristic smart home room",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
    prompt: "office workspace setup",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
    prompt: "bedroom interior design",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1487014679447-9f8336841d58",
    prompt: "colorful modern furniture",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1505691723518-36a5ac3be353",
    prompt: "luxury hotel room",
  },
];

const DEFAULT_RESULT: PipelineResult = {
  status: "idle",
  outputSrc: null,
  progress: 0,
  error: null,
};

function makeResults(count: number): PipelineResult[] {
  return Array.from({ length: count }, () => ({ ...DEFAULT_RESULT }));
}

function timestamp() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

// ---- StatusPill ----
function StatusPill({
  status,
  progress,
}: { status: ResultStatus; progress: number }) {
  if (status === "processing")
    return (
      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] gap-1">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        Running {progress}%
      </Badge>
    );
  if (status === "done")
    return (
      <Badge className="bg-success/20 text-success border-success/30 text-[10px] gap-1">
        <CheckCircle2 className="h-2.5 w-2.5" />
        Completed
      </Badge>
    );
  if (status === "error")
    return (
      <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px] gap-1">
        <XCircle className="h-2.5 w-2.5" />
        Error
      </Badge>
    );
  return (
    <Badge className="bg-muted/50 text-muted-foreground border-border text-[10px] gap-1">
      <Clock className="h-2.5 w-2.5" />
      Idle
    </Badge>
  );
}

// ---- PipelineCard ----
function PipelineCard({
  item,
  result,
  index,
  onSelect,
}: {
  item: PipelineItem;
  result: PipelineResult;
  index: number;
  onSelect: (i: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="rounded-lg border border-border bg-card overflow-hidden"
      data-ocid={`pipeline.item.${index + 1}`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">
            #{index + 1}
          </span>
          <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">
            {item.prompt}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={result.status} progress={result.progress} />
          <button
            type="button"
            onClick={() => onSelect(index)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-0.5 rounded border border-border hover:border-primary/40"
            data-ocid={`pipeline.edit_button.${index + 1}`}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {result.status === "processing" && (
        <Progress value={result.progress} className="h-0.5 rounded-none" />
      )}

      {/* 3-step flow */}
      <div className="flex items-stretch gap-0 p-3">
        {/* A – Input */}
        <div className="flex-1 min-w-0 rounded-md border border-border bg-background p-2">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
              A
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Input
            </span>
          </div>
          <div className="aspect-video w-full rounded overflow-hidden bg-muted/30">
            <img
              src={`${item.imageUrl}?w=200&auto=format`}
              alt="input"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <p className="text-[9px] text-muted-foreground mt-1 truncate">
            {item.imageUrl.replace("https://", "")}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex items-center px-2 text-muted-foreground">
          <ChevronRight className="h-4 w-4" />
        </div>

        {/* B – Prompt */}
        <div className="flex-1 min-w-0 rounded-md border border-border bg-background p-2">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-warning/20 text-warning">
              B
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Prompt
            </span>
          </div>
          <div className="aspect-video w-full rounded bg-muted/20 flex items-center justify-center p-2">
            <p className="text-[10px] text-foreground/80 text-center leading-relaxed line-clamp-4">
              {item.prompt}
            </p>
          </div>
          <p className="text-[9px] text-muted-foreground mt-1">
            Flux 1.0 · img2img
          </p>
        </div>

        {/* Arrow */}
        <div className="flex items-center px-2 text-muted-foreground">
          <ChevronRight className="h-4 w-4" />
        </div>

        {/* C – Output */}
        <div className="flex-1 min-w-0 rounded-md border border-border bg-background p-2">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-success/20 text-success">
              C
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Output
            </span>
          </div>
          <div className="aspect-video w-full rounded overflow-hidden bg-muted/30 flex items-center justify-center relative">
            {result.status === "idle" && (
              <div className="text-center">
                <Zap className="h-5 w-5 text-muted-foreground/40 mx-auto mb-1" />
                <p className="text-[9px] text-muted-foreground/40">
                  Not started
                </p>
              </div>
            )}
            {result.status === "processing" && (
              <div className="text-center">
                <Loader2 className="h-5 w-5 text-primary animate-spin mx-auto mb-1" />
                <p className="text-[9px] text-primary">{result.progress}%</p>
              </div>
            )}
            {result.status === "done" && result.outputSrc && (
              <img
                src={result.outputSrc}
                alt="output"
                className="w-full h-full object-cover"
              />
            )}
            {result.status === "error" && (
              <div className="text-center p-2">
                <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
                <p className="text-[9px] text-destructive line-clamp-2">
                  {result.error}
                </p>
              </div>
            )}
          </div>
          <p className="text-[9px] text-muted-foreground mt-1">
            {result.status === "done"
              ? "Generated"
              : result.status === "error"
                ? "Failed"
                : "Pending"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ---- Main App ----
export default function App() {
  const [items, setItems] = useState<PipelineItem[]>(DEFAULT_ITEMS);
  const [results, setResults] = useState<PipelineResult[]>(
    makeResults(DEFAULT_ITEMS.length),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "[System] FluxFlow ready. Click RUN ALL PIPELINES to start.",
  ]);
  const [settings, setSettings] = useState<Settings>({
    guidanceScale: 7.5,
    steps: 20,
    strength: 0.75,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editUrl, setEditUrl] = useState(DEFAULT_ITEMS[0].imageUrl);
  const [editPrompt, setEditPrompt] = useState(DEFAULT_ITEMS[0].prompt);
  const [newUrl, setNewUrl] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const stopRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const { data: backendPipelines } = useGetAllPipelines();
  const updateMutation = useUpdatePipeline();
  const addMutation = useAddPipeline();
  const resetMutation = useResetToDefault();

  // biome-ignore lint/correctness/useExhaustiveDependencies: resetMutation.mutate is stable
  useEffect(() => {
    if (backendPipelines) {
      if (backendPipelines.length > 0) {
        setItems(backendPipelines);
        setResults(makeResults(backendPipelines.length));
      } else {
        resetMutation.mutate(DEFAULT_ITEMS);
      }
    }
  }, [backendPipelines]);

  useEffect(() => {
    if (items[selectedIndex]) {
      setEditUrl(items[selectedIndex].imageUrl);
      setEditPrompt(items[selectedIndex].prompt);
    }
  }, [selectedIndex, items]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: logEndRef is a stable ref
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${timestamp()}] ${msg}`]);
  }, []);

  const runAllPipelines = useCallback(async () => {
    if (!window.puter?.ai) {
      toast.error(
        "Puter.js not loaded yet. Please wait a moment and try again.",
      );
      addLog("[Error] Puter.js not available.");
      return;
    }
    stopRef.current = false;
    setIsRunning(true);
    // Reset all results
    setResults(makeResults(items.length));
    addLog(`Starting pipeline for ${items.length} items...`);

    for (let i = 0; i < items.length; i++) {
      if (stopRef.current) {
        addLog("Pipeline stopped by user.");
        break;
      }
      const item = items[i];
      addLog(`[${i + 1}/${items.length}] Processing: "${item.prompt}"`);

      setResults((prev) => {
        const next = [...prev];
        next[i] = {
          status: "processing",
          outputSrc: null,
          progress: 10,
          error: null,
        };
        return next;
      });

      // Simulate incremental progress
      const progressInterval = setInterval(() => {
        setResults((prev) => {
          const next = [...prev];
          if (next[i]?.status === "processing") {
            next[i] = {
              ...next[i],
              progress: Math.min(next[i].progress + 8, 90),
            };
          }
          return next;
        });
      }, 800);

      try {
        let outputSrc: string | null = null;
        const enhancedPrompt = item.prompt + SECRET_SUFFIX;

        // Fetch input image as blob for img2img
        let inputBlob: Blob | null = null;
        try {
          const resp = await fetch(`${item.imageUrl}?w=512&auto=format`);
          if (resp.ok) inputBlob = await resp.blob();
        } catch (_) {
          // ignore fetch error, fall through to txt2img
        }

        if (window.puter.ai.img2img && inputBlob) {
          const result = await window.puter.ai.img2img(
            inputBlob,
            enhancedPrompt,
            false,
            { model: "flux-1" },
          );
          if (result instanceof Blob) {
            outputSrc = URL.createObjectURL(result);
          } else if (result instanceof HTMLImageElement) {
            outputSrc = result.src;
          } else if (
            result &&
            typeof (result as { src?: string }).src === "string"
          ) {
            outputSrc = (result as { src: string }).src;
          }
        } else {
          // fallback to txt2img
          const result = await window.puter.ai.txt2img(enhancedPrompt, false, {
            model: "flux-1",
          });
          if (result instanceof Blob) {
            outputSrc = URL.createObjectURL(result);
          } else if (result instanceof HTMLImageElement) {
            outputSrc = result.src;
          }
        }

        clearInterval(progressInterval);
        setResults((prev) => {
          const next = [...prev];
          next[i] = { status: "done", outputSrc, progress: 100, error: null };
          return next;
        });
        addLog(`[${i + 1}/${items.length}] ✓ Done: "${item.prompt}"`);
      } catch (err: unknown) {
        clearInterval(progressInterval);
        const errMsg = err instanceof Error ? err.message : String(err);
        setResults((prev) => {
          const next = [...prev];
          next[i] = {
            status: "error",
            outputSrc: null,
            progress: 0,
            error: errMsg,
          };
          return next;
        });
        addLog(`[${i + 1}/${items.length}] ✗ Error: ${errMsg}`);
      }
    }

    setIsRunning(false);
    addLog("Pipeline run complete.");
  }, [items, addLog]);

  const stopPipeline = useCallback(() => {
    stopRef.current = true;
    addLog("Stop requested...");
  }, [addLog]);

  const handleUpdateItem = useCallback(() => {
    if (!editUrl.trim() || !editPrompt.trim()) {
      toast.error("URL and prompt cannot be empty.");
      return;
    }
    setItems((prev) => {
      const next = [...prev];
      next[selectedIndex] = {
        imageUrl: editUrl.trim(),
        prompt: editPrompt.trim(),
      };
      return next;
    });
    setResults((prev) => {
      const next = [...prev];
      next[selectedIndex] = { ...DEFAULT_RESULT };
      return next;
    });
    // Persist to backend
    updateMutation.mutate({
      index: selectedIndex,
      imageUrl: editUrl.trim(),
      prompt: editPrompt.trim(),
    });
    addLog(`Updated item #${selectedIndex + 1}: "${editPrompt.trim()}"`);
    toast.success("Item updated.");
  }, [editUrl, editPrompt, selectedIndex, updateMutation, addLog]);

  const handleAddItem = useCallback(() => {
    if (!newUrl.trim() || !newPrompt.trim()) {
      toast.error("URL and prompt cannot be empty.");
      return;
    }
    const newItem = { imageUrl: newUrl.trim(), prompt: newPrompt.trim() };
    setItems((prev) => [...prev, newItem]);
    setResults((prev) => [...prev, { ...DEFAULT_RESULT }]);
    addMutation.mutate({ imageUrl: newUrl.trim(), prompt: newPrompt.trim() });
    addLog(`Added new item: "${newPrompt.trim()}"`);
    setNewUrl("");
    setNewPrompt("");
    toast.success("Item added.");
  }, [newUrl, newPrompt, addMutation, addLog]);

  const handleDeleteItem = useCallback(
    (index: number) => {
      if (items.length <= 1) {
        toast.error("Cannot delete the last item.");
        return;
      }
      setItems((prev) => prev.filter((_, i) => i !== index));
      setResults((prev) => prev.filter((_, i) => i !== index));
      if (selectedIndex >= index && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      }
      addLog(`Deleted item #${index + 1}`);
      toast.success("Item deleted.");
    },
    [items.length, selectedIndex, addLog],
  );

  const doneCount = results.filter((r) => r.status === "done").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster />

      {/* Navbar */}
      <header
        className="sticky top-0 z-50 h-14 border-b border-border bg-card/90 backdrop-blur-sm flex items-center px-6 gap-6"
        data-ocid="nav.panel"
      >
        <div className="flex items-center gap-2 mr-2">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-foreground tracking-tight">
            FluxFlow
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {["Dashboard", "Pipeline", "Models", "API", "Docs"].map((item) => (
            <button
              type="button"
              key={item}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                item === "Pipeline"
                  ? "text-primary border-b-2 border-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid={`nav.${item.toLowerCase()}.link`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="nav.search_input"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="nav.bell.button"
          >
            <Bell className="h-4 w-4" />
          </button>
          <div className="h-7 w-7 rounded-full bg-primary/30 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">FF</span>
          </div>
          <span className="text-sm text-muted-foreground hidden lg:block">
            FluxUser
          </span>
        </div>
      </header>

      {/* Hero */}
      <div className="text-center py-8 px-4">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-foreground mb-2"
        >
          AI Image Transformation Pipeline
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-sm text-muted-foreground"
        >
          Powered by Flux 1.0 · Puter.js · Batch img2img processing
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-success" />
            {doneCount} completed
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-destructive" />
            {errorCount} errors
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {items.length - doneCount - errorCount} pending
          </span>
        </motion.div>
      </div>

      {/* 3-column layout */}
      <div className="flex-1 flex gap-0 px-4 pb-6 max-w-[1600px] mx-auto w-full">
        {/* LEFT SIDEBAR */}
        <aside className="w-56 shrink-0 mr-4 space-y-4">
          <div
            className="rounded-lg border border-border bg-card p-4"
            data-ocid="settings.panel"
          >
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
              Project Settings
            </h3>

            <div className="space-y-1 mb-3">
              <Label className="text-[10px] text-muted-foreground">
                Base Model
              </Label>
              <div className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded px-2 py-1">
                Flux 1.0
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Guidance Scale
                  </Label>
                  <span className="text-[10px] text-primary">
                    {settings.guidanceScale.toFixed(1)}
                  </span>
                </div>
                <Slider
                  min={1}
                  max={20}
                  step={0.5}
                  value={[settings.guidanceScale]}
                  onValueChange={([v]) =>
                    setSettings((s) => ({ ...s, guidanceScale: v }))
                  }
                  className="h-1"
                  data-ocid="settings.guidance_scale.toggle"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Inference Steps
                  </Label>
                  <span className="text-[10px] text-primary">
                    {settings.steps}
                  </span>
                </div>
                <Slider
                  min={10}
                  max={50}
                  step={1}
                  value={[settings.steps]}
                  onValueChange={([v]) =>
                    setSettings((s) => ({ ...s, steps: v }))
                  }
                  className="h-1"
                  data-ocid="settings.steps.toggle"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Strength
                  </Label>
                  <span className="text-[10px] text-primary">
                    {settings.strength.toFixed(2)}
                  </span>
                </div>
                <Slider
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={[settings.strength]}
                  onValueChange={([v]) =>
                    setSettings((s) => ({ ...s, strength: v }))
                  }
                  className="h-1"
                  data-ocid="settings.strength.toggle"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {!isRunning ? (
                <Button
                  onClick={runAllPipelines}
                  className="w-full h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-white gap-1"
                  data-ocid="pipeline.run_all.primary_button"
                >
                  <Play className="h-3 w-3" />
                  RUN ALL PIPELINES
                </Button>
              ) : (
                <Button
                  onClick={stopPipeline}
                  variant="destructive"
                  className="w-full h-8 text-xs font-semibold gap-1"
                  data-ocid="pipeline.stop.button"
                >
                  <Square className="h-3 w-3" />
                  STOP
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-lg border border-border bg-card p-3">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Stats
            </h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="text-foreground font-medium">
                  {items.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Done</span>
                <span className="text-success font-medium">{doneCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Errors</span>
                <span className="text-destructive font-medium">
                  {errorCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Running</span>
                <span className="text-primary font-medium">
                  {isRunning ? 1 : 0}
                </span>
              </div>
            </div>
            {items.length > 0 && (
              <Progress
                value={(doneCount / items.length) * 100}
                className="mt-2 h-1"
              />
            )}
          </div>
        </aside>

        {/* CENTER – Pipeline Cards */}
        <main className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-foreground">
              Active Pipelines
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({items.length})
              </span>
            </h2>
            {isRunning && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing...
              </div>
            )}
          </div>

          <AnimatePresence initial={false}>
            {items.map((item, i) => (
              <PipelineCard
                key={`pipeline-${item.imageUrl}-${i}`}
                item={item}
                result={results[i] ?? DEFAULT_RESULT}
                index={i}
                onSelect={setSelectedIndex}
              />
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <div
              className="rounded-lg border border-border bg-card p-12 text-center"
              data-ocid="pipeline.empty_state"
            >
              <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No pipeline items. Add some from the editor.
              </p>
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="w-64 shrink-0 ml-4 space-y-4">
          {/* Editor */}
          <div
            className="rounded-lg border border-border bg-card p-4"
            data-ocid="editor.panel"
          >
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
              Add / Edit Item
            </h3>

            <div className="space-y-2 mb-3">
              <Label className="text-[10px] text-muted-foreground">
                Select Item
              </Label>
              <Select
                value={String(selectedIndex)}
                onValueChange={(v) => setSelectedIndex(Number(v))}
              >
                <SelectTrigger
                  className="h-7 text-xs"
                  data-ocid="editor.item.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item, i) => (
                    <SelectItem
                      key={`sel-${i}-${item.prompt.slice(0, 8)}`}
                      value={String(i)}
                      className="text-xs"
                    >
                      #{i + 1} – {item.prompt.slice(0, 24)}
                      {item.prompt.length > 24 ? "…" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">
                  Image URL
                </Label>
                <Input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="h-7 text-xs mt-1"
                  placeholder="https://..."
                  data-ocid="editor.url.input"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">
                  Prompt
                </Label>
                <Textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="text-xs mt-1 min-h-[64px] resize-none"
                  placeholder="Describe the transformation..."
                  data-ocid="editor.prompt.textarea"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleUpdateItem}
                size="sm"
                className="flex-1 h-7 text-xs bg-primary hover:bg-primary/90 text-white gap-1"
                data-ocid="editor.update.save_button"
              >
                <Save className="h-3 w-3" />
                Update
              </Button>
              <Button
                onClick={() => handleDeleteItem(selectedIndex)}
                size="sm"
                variant="destructive"
                className="h-7 text-xs px-2"
                data-ocid="editor.delete.delete_button"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Add new */}
            <div className="mt-4 pt-3 border-t border-border">
              <Label className="text-[10px] text-muted-foreground">
                Add New Item
              </Label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="h-7 text-xs mt-1.5"
                placeholder="Image URL..."
                data-ocid="editor.new_url.input"
              />
              <Textarea
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                className="text-xs mt-1.5 min-h-[48px] resize-none"
                placeholder="Prompt..."
                data-ocid="editor.new_prompt.textarea"
              />
              <Button
                onClick={handleAddItem}
                size="sm"
                variant="secondary"
                className="w-full h-7 text-xs mt-2 gap-1"
                data-ocid="editor.add.button"
              >
                <Plus className="h-3 w-3" />
                Add New Item
              </Button>
            </div>
          </div>

          {/* Pipeline Status Log */}
          <div
            className="rounded-lg border border-border bg-card p-4"
            data-ocid="log.panel"
          >
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              Pipeline Status
            </h3>
            <ScrollArea className="h-64">
              <div className="space-y-0.5 pr-2">
                {logs.map((log, i) => (
                  <div
                    key={`log-${i}-${log.slice(0, 20)}`}
                    className={`text-[10px] leading-relaxed font-mono ${
                      log.includes("✓")
                        ? "text-success"
                        : log.includes("✗") || log.includes("Error")
                          ? "text-destructive"
                          : log.includes("Stop")
                            ? "text-warning"
                            : "text-muted-foreground"
                    }`}
                  >
                    {log}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </ScrollArea>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-3 px-6 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex gap-4">
          <span className="cursor-pointer hover:text-foreground transition-colors">
            Privacy
          </span>
          <span className="cursor-pointer hover:text-foreground transition-colors">
            Terms
          </span>
          <span className="cursor-pointer hover:text-foreground transition-colors">
            Contact
          </span>
        </div>
        <span>
          © {new Date().getFullYear()}. Built with{" "}
          <span className="text-destructive">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </span>
      </footer>
    </div>
  );
}
