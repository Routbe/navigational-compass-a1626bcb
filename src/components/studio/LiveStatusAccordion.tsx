import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StatusContentSettings } from "@/components/dashboard/editor/StatusSettings";
import type { ProfileDisplayPrefs } from "@/lib/profile-display";

type SetPref = <K extends keyof ProfileDisplayPrefs>(key: K, value: ProfileDisplayPrefs[K]) => void;

/** 💬 Live Status & Gedachten: status indicator + status bericht. */
export function LiveStatusAccordion({ prefs, setPref }: { prefs: ProfileDisplayPrefs; setPref: SetPref }) {
  return (
    <AccordionItem value="live_status" className="rounded-2xl border border-border bg-card px-4 sm:px-5">
      <AccordionTrigger className="hover:no-underline">
        <span className="flex flex-1 items-center justify-between gap-3 pr-2">
          <span className="text-base font-medium">💬 Live Status &amp; Gedachten</span>
          {prefs.statusLine && (
            <span className="max-w-[45%] truncate rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
              {prefs.statusLine}
            </span>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-5">
        <StatusContentSettings prefs={prefs} setPref={setPref} bare />
      </AccordionContent>
    </AccordionItem>
  );
}
