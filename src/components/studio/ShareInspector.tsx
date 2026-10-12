import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileDisplayPrefs } from "@/lib/profile-display";

interface Props {
  prefs: ProfileDisplayPrefs;
  onPrefChange: <K extends keyof ProfileDisplayPrefs>(key: K, value: ProfileDisplayPrefs[K]) => void;
  displayName: string | null;
  bio: string | null;
}

/** Meta title, description and share image, with a link-preview mock-up. */
export function ShareInspector({ prefs, onPrefChange, displayName, bio }: Props) {
  return (
        <section className="space-y-2">
          <p className="text-xs font-medium">Social share inspecteur</p>
          <Input
            id="coach-meta-title"
            value={prefs.metaTitle ?? ""}
            maxLength={70}
            placeholder="Meta titel"
            aria-label="Meta titel"
            onChange={(e) => onPrefChange("metaTitle", e.target.value || null)}
            className="h-9 text-xs"
          />
          <Textarea
            value={prefs.metaDescription ?? ""}
            maxLength={200}
            placeholder="Meta omschrijving"
            aria-label="Meta omschrijving"
            onChange={(e) => onPrefChange("metaDescription", e.target.value || null)}
            className="min-h-16 text-xs"
          />
          <Input
            value={prefs.ogImageUrl ?? ""}
            placeholder="OpenGraph afbeelding (https://…)"
            aria-label="OpenGraph afbeelding"
            spellCheck={false}
            onChange={(e) => onPrefChange("ogImageUrl", e.target.value || null)}
            className="h-9 text-xs"
          />
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="aspect-[1.91/1] w-full bg-muted">
              {prefs.ogImageUrl ? (
                <img
                  src={prefs.ogImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>
            <div className="space-y-0.5 p-2">
              <p className="truncate text-xs font-medium">
                {prefs.metaTitle || displayName || "Jouw profiel"}
              </p>
              <p className="line-clamp-2 text-[11px] text-muted-foreground">
                {prefs.metaDescription || bio || "Voeg een omschrijving toe voor WhatsApp en LinkedIn."}
              </p>
            </div>
          </div>
        </section>
  );
}
