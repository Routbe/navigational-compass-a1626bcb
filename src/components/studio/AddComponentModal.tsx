import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BLOCK_KINDS } from "@/lib/profile";
import { VideoBlockDialog } from "./VideoBlockDialog";
import { ProUpgradeModal } from "./ProUpgradeModal";

/** Eén component uit de bibliotheek. `video` opent de embed/upload-keuze. */
interface LibraryItem {
  kind: string;
  label: string;
  note: string;
  isNew?: boolean;
}

interface LibraryGroup {
  id: string;
  title: string;
  items: LibraryItem[];
}

export const COMPONENT_LIBRARY: LibraryGroup[] = [
  {
    id: "standard",
    title: "Standaard",
    items: [
      { kind: "link", label: "Link", note: "Elke webpagina" },
      { kind: "instagram", label: "Socials", note: "Instagram, TikTok, X, …" },
      { kind: "text", label: "Tekst / Koptekst", note: "Intro, kop of aankondiging", isNew: true },
      { kind: "spacer", label: "Scheidingslijn", note: "Rust tussen secties", isNew: true },
    ],
  },
  {
    id: "media",
    title: "Media",
    items: [
      { kind: "video", label: "Video", note: "YouTube, Vimeo of TikTok", isNew: true },
      { kind: "media_gallery", label: "Afbeelding / Galerij", note: "Foto's in een raster", isNew: true },
      { kind: "spotify", label: "Spotify / Audio", note: "Track, album of podcast", isNew: true },
      { kind: "soundcloud", label: "Soundcloud", note: "Track of profiel" },
    ],
  },
  {
    id: "leads",
    title: "Interactie & Leads",
    items: [
      { kind: "newsletter", label: "Nieuwsbrief", note: "Laat bezoekers inschrijven", isNew: true },
      { kind: "contact_form", label: "Contactformulier", note: "Direct bericht", isNew: true },
      { kind: "vcard", label: "vCard", note: "Eén tik → in de contacten" },
      { kind: "live_poll", label: "Poll", note: "Stel je volgers een vraag" },
    ],
  },
  {
    id: "business",
    title: "Zakelijk & Web3",
    items: [
      { kind: "calendly", label: "Calendly-boeking", note: "Laat mensen een moment kiezen", isNew: true },
      { kind: "booking_request", label: "Boekingsaanvraag", note: "Eigen tijdslots" },
      { kind: "matrix", label: "Matrix", note: "Soeverein chatten" },
      { kind: "mastodon", label: "Fediverse", note: "Mastodon, Pixelfed, …" },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (kind: string, value?: string) => void;
}

/** De Component-bibliotheek: alles wat je aan je pagina kunt toevoegen. */
export function AddComponentModal({ open, onClose, onAdd }: Props) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [proOpen, setProOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Component-bibliotheek</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {COMPONENT_LIBRARY.map((group) => (
              <section key={group.id} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.title}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.items
                    .filter((item) => item.kind === "video" || BLOCK_KINDS.some((k) => k.kind === item.kind))
                    .map((item) => (
                      <button
                        key={item.kind}
                        type="button"
                        onClick={() => {
                          onClose();
                          if (item.kind === "video") setVideoOpen(true);
                          else onAdd(item.kind);
                        }}
                        className="rounded-xl border border-border bg-background p-3 text-left transition-colors hover:bg-muted"
                      >
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          {item.label}
                          {item.isNew && (
                            <span className="rounded-full bg-muted px-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Nieuw
                            </span>
                          )}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">{item.note}</span>
                      </button>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <VideoBlockDialog
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        onAdd={(url) => onAdd("media_embed", url)}
        onPro={() => setProOpen(true)}
      />
      <ProUpgradeModal open={proOpen} onClose={() => setProOpen(false)} />
    </>
  );
}
