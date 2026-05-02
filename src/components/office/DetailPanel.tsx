import { useState } from "react";
import { Loader2, FileText, FileDown } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { Installation } from "@/lib/types";
import { PhotoGrid } from "./PhotoGrid";
import { ResultBanner } from "./ResultBanner";
import { ReviewModal } from "./ReviewModal";
import { CommentsSection } from "./CommentsSection";
import { InstallationReport } from "./InstallationReport";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useUpdateStatus } from "@/lib/useInstallationsQuery";
import { useAuth } from "@/context/AuthContext";

interface DetailPanelProps {
  installation?: Installation;
  isLoading?: boolean;
}

export function DetailPanel({ installation, isLoading }: DetailPanelProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { mutate: updateStatus, isPending } = useUpdateStatus();
  const [modal, setModal] = useState<"approve" | "reject" | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-office">
        <Loader2 className="h-8 w-8 animate-spin text-office-accent" />
      </div>
    );
  }

  if (!installation) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-office">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-office-panel text-office-muted">
            <FileText className="h-8 w-8" />
          </div>
          <div className="text-sm font-medium text-office-muted">
            Fall aus der Queue auswählen
          </div>
        </div>
      </div>
    );
  }

  function handleReview(comment: string) {
    if (!modal || !installation) return;
    const status = modal === "approve" ? "approved" : "rejected";
    updateStatus(
      {
        jobId: installation.id,
        status,
        reviewComment: comment,
        reviewedBy: profile?.id,
      },
      {
        onSuccess: () => {
          setModal(null);
          toast({
            title: modal === "approve" ? "Freigegeben" : "Abgelehnt",
            description: `${installation.id} wurde ${modal === "approve" ? "freigegeben" : "abgelehnt"}.`,
            variant: modal === "approve" ? "default" : "destructive",
          });
        },
      }
    );
  }

  async function handleDownloadPdf() {
    if (!installation) return;
    setPdfLoading(true);
    try {
      const blob = await pdf(<InstallationReport installation={installation} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bericht - ${installation.id} - ${installation.electrician}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "PDF-Fehler", description: "Bericht konnte nicht erstellt werden.", variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <>
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-office">
        <div className="flex items-start justify-between border-b border-office px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-mono text-lg font-bold text-office-fg">{installation.id}</h2>
              <StatusBadge status={installation.status} size="md" />
            </div>
            <div className="mt-1 text-xs text-office-muted">
              {formatDateTime(installation.createdAt)} · {installation.electrician}
            </div>
            {installation.reviewedBy && (
              <div className="mt-0.5 text-xs text-office-muted/70">
                Geprüft von {installation.reviewedBy}
                {installation.reviewedAt ? ` · ${formatDateTime(installation.reviewedAt)}` : ""}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            title="PDF-Bericht herunterladen"
            className="flex items-center gap-1.5 rounded-lg border border-office px-3 py-1.5 text-xs font-medium text-office-muted hover:border-office-accent/50 hover:text-office-fg disabled:opacity-50"
          >
            <FileDown className="h-3.5 w-3.5" />
            {pdfLoading ? "…" : "PDF"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            <ResultBanner installation={installation} />

            <div className="rounded-xl border border-office bg-office-panel p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-office-muted">
                Zählernummer
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-office-fg">
                {installation.meterNumber}
              </div>
            </div>

            {installation.reviewComment && (
              <div className="rounded-xl border border-office bg-office-panel p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-office-muted">
                  Prüfkommentar
                </div>
                <p className="mt-1.5 text-sm text-office-fg">{installation.reviewComment}</p>
                {installation.reviewedBy && (
                  <div className="mt-1 text-xs text-office-muted">
                    — {installation.reviewedBy}
                    {installation.reviewedAt ? `, ${formatDateTime(installation.reviewedAt)}` : ""}
                  </div>
                )}
              </div>
            )}

            <PhotoGrid
              photos={installation.photos}
              jobId={installation.id}
              electrician={installation.electrician}
            />

            <CommentsSection
              installationDbId={installation.dbId}
              authorId={profile?.id ?? ""}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-office bg-office-panel px-6 py-3">
          <button
            type="button"
            onClick={() => setModal("reject")}
            disabled={isPending}
            className="min-h-[40px] rounded-lg bg-destructive px-5 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
          >
            Ablehnen
          </button>
          <button
            type="button"
            onClick={() => setModal("approve")}
            disabled={isPending}
            className="min-h-[40px] rounded-lg bg-success px-5 text-sm font-semibold text-success-foreground hover:opacity-90 disabled:opacity-50"
          >
            Freigeben
          </button>
        </div>
      </div>

      <ReviewModal
        open={!!modal}
        action={modal ?? "approve"}
        jobId={installation.id}
        onConfirm={handleReview}
        onCancel={() => setModal(null)}
        isPending={isPending}
      />
    </>
  );
}
