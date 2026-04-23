/**
 * CandidateNotesPanel — internal recruiter notes per shortlisted application.
 * Lazy-loaded list + inline create form. Only available after shortlist.
 */

import { useEffect, useState } from "react";
import { StickyNote, Trash2, Plus } from "lucide-react";
import { candidateNotesRepository, type CandidateNote } from "@/repositories/supabase/candidateNotes";
import { toast } from "sonner";
import { timeAgo } from "@/lib/timeAgo";

interface Props {
  applicationId: string;
  candidateId: string;
  jobId: string;
  employerId: string;
}

export default function CandidateNotesPanel({ applicationId, candidateId, jobId, employerId }: Props) {
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const reload = async () => {
    setLoading(true);
    const list = await candidateNotesRepository.listForApplication(applicationId);
    setNotes(list);
    setLoading(false);
  };

  useEffect(() => {
    if (open) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, applicationId]);

  const handleAdd = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const note = await candidateNotesRepository.create({
        employerId, applicationId, candidateId, jobId, note: text,
      });
      setNotes((prev) => [note, ...prev]);
      setDraft("");
      toast.success("Notatka zapisana");
    } catch (e: any) {
      toast.error(`Nie udało się zapisać: ${e?.message || "błąd"}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await candidateNotesRepository.delete(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error("Nie udało się usunąć notatki");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-secondary/50 transition-colors"
      >
        <StickyNote className="w-3.5 h-3.5" />
        Notatki wewnętrzne {notes.length > 0 && <span className="text-accent">({notes.length})</span>}
        <span className="ml-auto text-[10px] font-normal normal-case text-muted-foreground/70">
          {open ? "Zwiń" : "Rozwiń"}
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder="Dodaj notatkę (widoczna tylko dla Ciebie)"
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-secondary text-foreground text-xs border border-border placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={busy}
            />
            <button
              onClick={handleAdd}
              disabled={busy || !draft.trim()}
              className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Dodaj
            </button>
          </div>

          {loading ? (
            <p className="text-[11px] text-muted-foreground py-2">Wczytywanie…</p>
          ) : notes.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-2">Brak notatek. Pierwsza obserwacja po rozmowie?</p>
          ) : (
            <ul className="space-y-1.5">
              {notes.map((n) => (
                <li key={n.id} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/40 border border-border/60 text-xs">
                  <div className="flex-1">
                    <p className="text-foreground whitespace-pre-wrap">{n.note}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="text-muted-foreground hover:text-destructive p-1 -mr-1"
                    title="Usuń notatkę"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
