import { Installation } from "@/lib/types";

interface ResultBannerProps {
  installation: Installation;
}

export function ResultBanner({ installation }: ResultBannerProps) {
  const failed = installation.photos.filter((p) => p.status === "failed").length;
  const passed = installation.photos.length - failed;
  const isPositive =
    installation.status === "auto_approved" || installation.status === "approved";

  return (
    <div
      className={[
        "rounded-xl border p-4",
        isPositive
          ? "border-success/30 bg-success/10"
          : "border-destructive/30 bg-destructive/10",
      ].join(" ")}
    >
      <div
        className={[
          "text-sm font-semibold",
          isPositive ? "text-success" : "text-destructive",
        ].join(" ")}
      >
        {isPositive
          ? "Installation erfolgreich geprüft ✓"
          : "Edge Case – manuelle Prüfung erforderlich"}
      </div>
      <div className="mt-1 text-xs text-office-muted">
        {passed} von {installation.photos.length} Fotos bestanden
        {failed > 0 && ` · ${failed} mit Auffälligkeiten`}
      </div>
    </div>
  );
}
