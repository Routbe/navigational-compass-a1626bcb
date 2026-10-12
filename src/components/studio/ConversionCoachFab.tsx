import { useState, type ComponentProps } from "react";
import { Lightbulb } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { auditProfile, hasPrimaryAction } from "@/lib/conversion-coach";
import { ConversionCoachAccordion } from "./ConversionCoachAccordion";

type Props = ComponentProps<typeof ConversionCoachAccordion>;

/** Floating lightbulb with the live score; opens the coach in a side panel. */
export function ConversionCoachFab(props: Props) {
  const [open, setOpen] = useState(false);
  const { blocks, avatarUrl, bio, prefs } = props;
  const score = auditProfile({
    blocks,
    avatarUrl,
    bio,
    hasPrimaryAction: hasPrimaryAction(blocks),
    highlightActive: prefs.ctaEffect !== "none" && Boolean(prefs.ctaBlockId),
    metaTitle: prefs.metaTitle,
    metaDescription: prefs.metaDescription,
    ogImageUrl: prefs.ogImageUrl,
  }).score;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Conversie Coach openen, score ${score} van 100`}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-border bg-card py-2 pl-2.5 pr-3.5 shadow-lg transition-transform hover:scale-105"
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
          <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
          {score < 100 && (
            <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
          )}
        </span>
        <span className="text-xs font-semibold tabular-nums">{score}/100</span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>💡 Conversie Coach</SheetTitle>
          </SheetHeader>
          <Accordion type="single" collapsible defaultValue="conversion_tips" className="mt-4">
            <ConversionCoachAccordion {...props} />
          </Accordion>
        </SheetContent>
      </Sheet>
    </>
  );
}
