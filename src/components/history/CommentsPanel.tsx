import { useState, type FormEvent } from "react";
import { Button } from "@/components/base/Button";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/services/api";
import type { HistoryEvent } from "@/types";

interface CommentsPanelProps {
  event: HistoryEvent;
  canComment: boolean;
  onSaved: () => Promise<void>;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentsPanel({
  event,
  canComment,
  onSaved,
}: CommentsPanelProps) {
  const { notify } = useToast();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const comments = event.comments ?? [];

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const value = text.trim();
    if (!value) return;

    setSaving(true);
    setError(null);
    try {
      await api.addHistoryComment(event.id, value);
      setText("");
      await onSaved();
      notify("Commentaire ajouté.", "ok");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Commentaire impossible.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="text-[11px] font-bold tracking-wide text-ink-soft">
        Commentaires ({comments.length})
      </p>

      {comments.length === 0 ? (
        <p className="mt-1.5 text-sm text-ink-faint">
          Aucun commentaire pour l'instant.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-lg border border-line bg-card p-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-ink">
                  {comment.authorName}
                </span>
                <span className="text-xs text-ink-faint">
                  {formatDate(comment.at)}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">
                {comment.text}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canComment && (
        <form onSubmit={handleSubmit} className="mt-3">
          <label htmlFor={`comment-${event.id}`} className="sr-only">
            Ajouter un commentaire
          </label>
          <textarea
            id={`comment-${event.id}`}
            rows={2}
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={saving}
            placeholder="Ajouter une précision, une consigne ou un suivi…"
            className="w-full resize-y rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink shadow-sm transition-colors placeholder:text-ink-faint focus:border-adm-500 focus:outline-none disabled:bg-paper"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-ink-faint tabular-nums">
              {text.length}/1000
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={saving || text.trim().length === 0}
            >
              {saving ? "Envoi…" : "Commenter"}
            </Button>
          </div>
          {error && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-deep">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
