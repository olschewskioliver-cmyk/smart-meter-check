import { Loader2, FileText } from "lucide-react";
import { Installation } from "@/lib/types";
import { PhotoGrid } from "./PhotoGrid";
import { ResultBanner } from "./ResultBanner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useUpdateStatus } from "@/lib/useInstallationsQuery";

interface DetailPanelProps {
  installation?: Installation;
  isLoading?: boolean;
}

export function DetailPanel({ installation, isLoading }: DetailPanelProps) {
  const { toast } = useToast();
  const { mutate: updateStatus, isPending } = useUpdateStatus();

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

  function handleApprove() {
    updateStatus(
      { jobId: installation!.id, status: "approved" },
      { onSuccess: () => toast({ title: "Freigegeben", description: `${installation!.id} wurde freigegeben.` }) }
    );
  }

  function handleReject() {
    updateStatus(
      { jobId: installation!.id, status: "rejected" },
      {
        onSuccess: () => toast({
          title: "Abgelehnt",
          description: `${installation!.id} wurde abgelehnt.`,
          variant: "destructive",
        }),
      }
    );
  }

  return (
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
        </div>
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

          <PhotoGrid photos={installation.photos} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-office bg-office-panel px-6 py-3">
        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="min-h-[40px] rounded-lg bg-destructive px-5 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
        >
          Ablehnen
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          className="min-h-[40px] rounded-lg bg-success px-5 text-sm font-semibold text-success-foreground hover:opacity-90 disabled:opacity-50"
        >
          Freigeben
        </button>
      </div>
    </div>
  );
}
