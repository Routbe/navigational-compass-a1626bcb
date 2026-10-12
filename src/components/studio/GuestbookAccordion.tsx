import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Pin, PinOff, Trash2 } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { deleteGuestbookNote, getMyGuestbook, pinGuestbookNote } from "@/lib/guestbook.functions";
import { GUESTBOOK_PIN_LIMIT } from "@/lib/guestbook-rules";

/** Studio: all received notes; pin the best ones to the public Prikbord. */
export function GuestbookAccordion() {
  const qc = useQueryClient();
  const fetchMine = useServerFn(getMyGuestbook);
  const pin = useServerFn(pinGuestbookNote);
  const del = useServerFn(deleteGuestbookNote);
  const q = useQuery({ queryKey: ["my-guestbook"], queryFn: () => fetchMine(), retry: false });
  const notes = q.data?.notes ?? [];
  const pinnedCount = notes.filter((n) => n.pinned).length;
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-guestbook"] });

  return (
    <AccordionItem value="guestbook" className="rounded-2xl border border-border bg-card px-4 sm:px-5">
      <AccordionTrigger className="hover:no-underline">
        <span className="text-left">
          <span className="block text-sm font-medium">Prikbord</span>
          <span className="block text-xs text-muted-foreground">{notes.length} berichten · {pinnedCount}/{GUESTBOOK_PIN_LIMIT} gepind</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-2 pb-5">
        {notes.length === 0 && <p className="text-xs text-muted-foreground">Nog geen berichten. Ingelogde ROUT-leden kunnen er op je profiel één achterlaten.</p>}
        {notes.map((n) => (
          <div key={n.id} className={`flex items-start gap-2 rounded-xl border p-3 ${n.pinned ? "border-primary/50 bg-primary/5" : "border-border"}`}>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm">{n.body}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                @{n.author.username ?? "onbekend"} · {new Date(n.createdAt).toLocaleDateString("nl-BE")}
              </p>
            </div>
            <button
              type="button"
              aria-label={n.pinned ? "Losmaken" : "Pinnen"}
              onClick={async () => {
                const { result } = await pin({ data: { id: n.id, pinned: !n.pinned } });
                if (result === "limit") toast.error(`Maximaal ${GUESTBOOK_PIN_LIMIT} gepinde berichten`);
                await refresh();
              }}
              className="rounded-lg border border-border p-1.5 hover:bg-muted"
            >
              {n.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </button>
            <button
              type="button"
              aria-label="Verwijderen"
              onClick={async () => {
                await del({ data: { id: n.id } });
                await refresh();
              }}
              className="rounded-lg border border-border p-1.5 hover:bg-muted"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}
