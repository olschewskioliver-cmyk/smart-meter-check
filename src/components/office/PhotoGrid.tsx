import { useState } from "react";
import { PhotoCheck, STEPS } from "@/lib/types";
import { Check, X, Download, ImageOff } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PhotoGridProps {
  photos: PhotoCheck[];
  jobId: string;
  electrician: string;
}

function sanitize(str: string) {
  return str.replace(/[^a-zA-Z0-9\-_äöüÄÖÜß ]/g, "").trim();
}

async function downloadPhoto(imageUrl: string, filename: string) {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PhotoGrid({ photos, jobId, electrician }: PhotoGridProps) {
  const [zoomed, setZoomed] = useState<PhotoCheck | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {STEPS.map((s) => {
          const photo = photos.find((p) => p.step === s.key);
          if (!photo) return null;
          const passed = photo.status === "passed";
          const filename = `Foto ${s.index} - ${sanitize(jobId)} - ${sanitize(electrician)}.jpg`;

          return (
            <div
              key={s.key}
              className="overflow-hidden rounded-xl border border-office bg-office-panel"
            >
              <div className="relative block aspect-video w-full overflow-hidden bg-office-elevated">
                <button
                  type="button"
                  onClick={() => photo.imageUrl ? setZoomed(photo) : undefined}
                  className="h-full w-full"
                >
                  {photo.imageUrl ? (
                    <img
                      src={photo.imageUrl}
                      alt={s.title}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty("display", "flex");
                      }}
                    />
                  ) : null}
                  <div className={`${photo.imageUrl ? "hidden" : "flex"} h-full w-full flex-col items-center justify-center gap-2 text-office-muted`}>
                    <ImageOff className="h-8 w-8 opacity-40" />
                    <span className="text-xs opacity-50">Foto nicht verfügbar</span>
                  </div>
                </button>
                <button
                  type="button"
                  title="Foto herunterladen"
                  onClick={() => downloadPhoto(photo.imageUrl, filename)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-office-muted">
                      Schritt {s.index}
                    </div>
                    <div className="truncate text-sm font-semibold text-office-fg">
                      {s.title}
                    </div>
                  </div>
                  <div
                    className={[
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      passed
                        ? "bg-success/20 text-success"
                        : "bg-destructive/20 text-destructive",
                    ].join(" ")}
                  >
                    {passed ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      <X className="h-4 w-4" strokeWidth={3} />
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <span
                    className={[
                      "rounded px-1.5 py-0.5 font-semibold",
                      passed
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive",
                    ].join(" ")}
                  >
                    {passed ? "OK" : "Fehler"}
                  </span>
                  <span className="text-office-muted">
                    Konfidenz {Math.round(photo.confidence * 100)}%
                  </span>
                </div>
                <p
                  className={[
                    "mt-2 text-xs leading-snug",
                    passed ? "text-office-muted" : "text-destructive",
                  ].join(" ")}
                >
                  {photo.reasoning}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!zoomed} onOpenChange={(o) => !o && setZoomed(null)}>
        <DialogContent className="max-w-3xl border-office bg-office-panel p-0">
          {zoomed && (
            <img
              src={zoomed.imageUrl}
              alt=""
              className="h-auto max-h-[80vh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
