import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ReviewModalProps {
  open: boolean;
  action: "approve" | "reject";
  jobId: string;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function ReviewModal({ open, action, jobId, onConfirm, onCancel, isPending }: ReviewModalProps) {
  const [comment, setComment] = useState("");

  function handleConfirm() {
    onConfirm(comment);
    setComment("");
  }

  function handleCancel() {
    setComment("");
    onCancel();
  }

  const isApprove = action === "approve";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent className="border-office bg-office-panel sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-office-fg">
            {isApprove ? "Installation freigeben" : "Installation ablehnen"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-1 text-sm text-office-muted">
          {jobId} —{" "}
          {isApprove
            ? "Möchtest du diese Installation freigeben?"
            : "Möchtest du diese Installation ablehnen?"}
        </div>

        <div className="mt-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-office-muted">
            Kommentar (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isApprove ? "Grund für Freigabe…" : "Grund für Ablehnung…"}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-lg border border-office bg-office-elevated px-3 py-2 text-sm text-office-fg placeholder:text-office-muted/50 focus:border-office-accent focus:outline-none"
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="rounded-lg border border-office px-4 py-2 text-sm font-medium text-office-muted hover:border-office-accent/50 disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={[
              "min-w-[100px] rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50",
              isApprove
                ? "bg-success text-success-foreground hover:opacity-90"
                : "bg-destructive text-destructive-foreground hover:opacity-90",
            ].join(" ")}
          >
            {isPending ? "…" : isApprove ? "Freigeben" : "Ablehnen"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
