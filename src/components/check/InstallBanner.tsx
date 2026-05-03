import { Download, Share, X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export function InstallBanner() {
  const { showBanner, ios, install, dismiss, canInstall } = useInstallPrompt();

  if (!showBanner) return null;

  return (
    <div className="mx-auto w-full max-w-[430px] px-5 pt-3">
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {ios ? (
            <Share className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">Als App installieren</div>
          {ios ? (
            <div className="mt-0.5 text-xs text-muted-foreground">
              Tippe auf{" "}
              <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                <Share className="inline h-3 w-3" /> Teilen
              </span>{" "}
              → „Zum Home-Bildschirm"
            </div>
          ) : (
            <div className="mt-0.5 text-xs text-muted-foreground">
              Installiere die App für schnelleren Zugriff
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canInstall && !ios && (
            <button
              type="button"
              onClick={install}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Installieren
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
