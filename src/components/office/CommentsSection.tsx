import { useState } from "react";
import { Send } from "lucide-react";
import { useInstallationComments, useAddComment } from "@/lib/useInstallationsQuery";
import { formatDateTime } from "@/lib/format";

interface CommentsSectionProps {
  installationDbId: string;
  authorId: string;
}

export function CommentsSection({ installationDbId, authorId }: CommentsSectionProps) {
  const [draft, setDraft] = useState("");
  const { data: comments = [] } = useInstallationComments(installationDbId);
  const { mutate: addComment, isPending } = useAddComment();

  function handleSubmit() {
    const body = draft.trim();
    if (!body) return;
    addComment(
      { installationDbId, authorId, body },
      { onSuccess: () => setDraft("") }
    );
  }

  return (
    <div className="rounded-xl border border-office bg-office-panel p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-office-muted">
        Interne Kommentare
      </div>

      {comments.length > 0 && (
        <div className="mt-3 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-office bg-office-elevated px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-office-fg">{c.authorName}</span>
                <span className="text-[11px] text-office-muted">{formatDateTime(c.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs text-office-muted leading-snug">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          placeholder="Kommentar hinzufügen…"
          className="flex-1 rounded-lg border border-office bg-office-elevated px-3 py-2 text-xs text-office-fg placeholder:text-office-muted/50 focus:border-office-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !draft.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-office-accent text-white hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
