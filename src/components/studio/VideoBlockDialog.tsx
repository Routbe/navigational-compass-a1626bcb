import { useMemo, useState } from "react";
import { Lock, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { videoEmbedUrl } from "@/lib/video-embed";
import { ProPill } from "./ProPill";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Adds a video block with the pasted URL. */
  onAdd: (url: string) => void;
  onPro: () => void;
}

/** Video block: free embed by link, or (Pro) native upload. */
export function VideoBlockDialog({ open, onClose, onAdd, onPro }: Props) {
  const [url, setUrl] = useState("");
  const embed = useMemo(() => videoEmbedUrl(url), [url]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Video toevoegen</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="link">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Plak Link (Gratis)</TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5">
              Upload Bestand <ProPill />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="link" className="space-y-3 pt-3">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=… · vimeo.com/… · tiktok.com/…"
              aria-label="Video-link"
              spellCheck={false}
            />
            {embed ? (
              <div className="aspect-video overflow-hidden rounded-xl border border-border bg-muted">
                <iframe
                  src={embed}
                  title="Videovoorbeeld"
                  className="h-full w-full"
                  allow="encrypted-media; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : url.trim() ? (
              <p className="text-xs text-muted-foreground">Plak een YouTube-, Vimeo- of TikTok-link.</p>
            ) : null}
            <Button
              className="w-full"
              disabled={!embed}
              onClick={() => {
                onAdd(url.trim());
                setUrl("");
                onClose();
              }}
            >
              Video toevoegen
            </Button>
          </TabsContent>
          <TabsContent value="upload" className="pt-3">
            <button
              type="button"
              onClick={onPro}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-muted-foreground transition-colors hover:bg-muted/50"
            >
              <span className="relative">
                <UploadCloud className="h-8 w-8" aria-hidden />
                <Lock className="absolute -bottom-1 -right-1 h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="text-sm font-medium text-foreground">Sleep je video hierheen</span>
              <span className="text-xs">Native uploads komen met ROUT Pro.</span>
            </button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
