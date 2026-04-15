import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Car, HelpCircle, MapPin, Route, Search, X } from "lucide-react";

/**
 * Compact “How to use” popover for Route Risk: map picks, Google search, and example trip.
 */
export default function RouteGuidancePopover() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", onDoc);
    }
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="route-guidance-popover"
        className="inline-flex items-center gap-1.5 rounded-lg border border-accent-primary/40 bg-accent-primary/10 px-2.5 py-1.5 text-xs font-medium text-accent-primary transition hover:bg-accent-primary/20"
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden />
        How to use
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="route-guidance-popover"
            role="dialog"
            aria-modal="true"
            aria-labelledby="route-guidance-title"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+8px)] z-[700] w-[min(calc(100vw-2rem),380px)] origin-top-right rounded-xl border border-border bg-bg-card/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 id="route-guidance-title" className="font-display text-sm font-semibold text-txt-primary">
                  Set your route
                </h2>
                <p className="mt-0.5 text-[11px] text-txt-secondary">
                  Choose source and destination, then score risk.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-txt-secondary transition hover:bg-bg-secondary hover:text-txt-primary"
                aria-label="Close guidance"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="space-y-3 text-xs text-txt-secondary">
              <li className="flex gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-primary/15 text-accent-primary">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-medium text-txt-primary">Map — pick on the map</p>
                  <p className="mt-0.5 leading-relaxed">
                    Tap <strong className="text-txt-primary">Pick</strong> next to Source, then click the map for your
                    start (car marker). Tap <strong className="text-txt-primary">Pick</strong> for Destination, click
                    again for the end (pin marker). Addresses fill in the boxes below.
                  </p>
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-secondary/15 text-accent-secondary">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-medium text-txt-primary">Search — Google Geocoding</p>
                  <p className="mt-0.5 leading-relaxed">
                    Type a place or address and press <strong className="text-txt-primary">Find</strong>. You need a{" "}
                    <span className="font-mono text-[10px] text-txt-primary">VITE_GOOGLE_MAPS_API_KEY</span> with
                    Geocoding API enabled. The map jumps to each result and frames both points when source and
                    destination are set.
                  </p>
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-success/15 text-accent-success">
                  <Route className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-medium text-txt-primary">Example</p>
                  <p className="mt-0.5 leading-relaxed">
                    Search <strong className="text-txt-primary">Chennai</strong> as source, then{" "}
                    <strong className="text-txt-primary">Salem</strong> as destination — markers update and the map zooms
                    to show both cities.
                  </p>
                </div>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-bg-secondary text-accent-warning">
                  <Car className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-medium text-txt-primary">Next</p>
                  <p className="mt-0.5 leading-relaxed">
                    Adjust road and weather fields if needed, then <strong className="text-txt-primary">Score full route</strong>{" "}
                    to see risk along the corridor.
                  </p>
                </div>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
