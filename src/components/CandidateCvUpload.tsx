import { useState, useEffect } from "react";
import { Upload, FileText, Trash2, Loader2, AlertCircle, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  type CvRecord,
  type CvParsedRecord,
  fetchLatestCv,
  fetchParsedData,
  startAiPreparation,
} from "@/lib/cvHelpers";

type CvState = "empty" | "uploaded" | "ready_for_ai" | "processing" | "needs_review" | "failed";

function deriveCvState(cv: CvRecord | null, parsed: CvParsedRecord | null): CvState {
  if (!cv) return "empty";
  if (cv.status === "processing") return "processing";
  if (cv.status === "failed") return "failed";
  if (cv.status === "needs_review" || parsed) return "needs_review";
  // Has CV, no parsed data yet → ready for AI
  return "ready_for_ai";
}

export default function CandidateCvUpload() {
  const { user } = useAuth();
  const [lastCv, setLastCv] = useState<CvRecord | null>(null);
  const [parsedData, setParsedData] = useState<CvParsedRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [aiProcessing, setAiProcessing] = useState(false);

  const cvState = deriveCvState(lastCv, parsedData);

  useEffect(() => {
    if (!user) {
      setLoadingRecord(false);
      return;
    }
    const load = async () => {
      const cv = await fetchLatestCv(user.id);
      setLastCv(cv);
      if (cv) {
        const parsed = await fetchParsedData(cv.id);
        setParsedData(parsed);
      }
      setLoadingRecord(false);
    };
    load();
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!user) {
      toast.error("Musisz być zalogowany, aby przesłać CV.");
      return;
    }
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Dozwolone tylko pliki PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Plik jest za duży. Maksymalny rozmiar to 5 MB.");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 12, 90));
    }, 120);

    const storagePath = `${user.id}/${Date.now()}-${file.name}`;

    const { error: storageErr } = await supabase.storage
      .from("candidate-cvs")
      .upload(storagePath, file);

    if (storageErr) {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
      toast.error("Nie udało się przesłać pliku: " + storageErr.message);
      return;
    }

    const { data: insertedRow, error: dbErr } = await (supabase as any)
      .from("cv_uploads")
      .insert({
        user_id: user.id,
        file_path: storagePath,
        file_name: file.name,
        mime_type: "application/pdf",
        status: "pending",
      })
      .select("id, file_name, file_path, status, error_message, created_at")
      .single();

    clearInterval(progressInterval);

    if (dbErr) {
      await supabase.storage.from("candidate-cvs").remove([storagePath]);
      setUploading(false);
      setUploadProgress(0);
      toast.error("Nie udało się zapisać informacji o CV: " + dbErr.message);
      return;
    }

    setUploadProgress(100);
    setTimeout(() => {
      setLastCv(insertedRow as CvRecord);
      setParsedData(null); // New CV, no parsed data yet
      setUploading(false);
      setUploadProgress(0);
      toast.success("CV przesłane pomyślnie!");
    }, 300);
  };

  const handleRemove = async () => {
    if (!lastCv || !user) return;
    try {
      await supabase.storage.from("candidate-cvs").remove([lastCv.file_path]);
      await (supabase as any).from("cv_uploads").delete().eq("id", lastCv.id);
      setLastCv(null);
      setParsedData(null);
      toast.success("CV zostało usunięte.");
    } catch {
      toast.error("Nie udało się usunąć CV.");
    }
  };

  const handleStartAi = async () => {
    if (!lastCv || !user || aiProcessing) return;

    // Check for existing parsed data with raw_text to prevent re-extraction
    const existing = await fetchParsedData(lastCv.id);
    if (existing?.raw_text && existing.raw_text.length > 0) {
      setParsedData(existing);
      const refreshed = await fetchLatestCv(user.id);
      if (refreshed) setLastCv(refreshed);
      toast.info("Tekst z CV został już odczytany. Gotowe do kolejnego kroku.");
      return;
    }

    setAiProcessing(true);
    setLastCv({ ...lastCv, status: "processing" });

    const result = await startAiPreparation(lastCv.id, user.id, lastCv.file_path);

    if (!result.success) {
      setLastCv({ ...lastCv, status: "failed", error_message: result.error || "Nieznany błąd" });
      setAiProcessing(false);
      toast.error("Nie udało się odczytać CV: " + (result.error || "Nieznany błąd"));
      return;
    }

    // Refresh state
    const refreshedCv = await fetchLatestCv(user.id);
    if (refreshedCv) setLastCv(refreshedCv);
    const refreshedParsed = await fetchParsedData(lastCv.id);
    setParsedData(refreshedParsed);
    setAiProcessing(false);
    toast.success("Tekst z CV został odczytany! Gotowe do analizy AI.");
  };

  if (loadingRecord) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Ładowanie…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        Zaloguj się, aby przesłać CV.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Upload area or file info ── */}
      {lastCv && !uploading ? (
        <FileCard
          cv={lastCv}
          onUpload={handleUpload}
          onRemove={handleRemove}
        />
      ) : (
        <div className="relative border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-secondary/20 transition-all">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-3">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            {uploading ? "Przesyłanie…" : "Kliknij lub przeciągnij plik PDF"}
          </p>
          <p className="text-xs text-muted-foreground">Tylko PDF, maks. 5 MB</p>

          {uploading && (
            <div className="w-full max-w-xs mt-4">
              <Progress value={uploadProgress} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-2 text-right">{uploadProgress}%</p>
            </div>
          )}
        </div>
      )}

      {/* ── AI CTA section ── */}
      {lastCv && !uploading && <AiSection state={cvState} onStart={handleStartAi} processing={aiProcessing} errorMessage={lastCv.error_message} />}
    </div>
  );
}

/* ── Sub-components ── */

function FileCard({ cv, onUpload, onRemove }: { cv: CvRecord; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; onRemove: () => void }) {
  const date = new Date(cv.created_at);
  const dateStr = date.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/30">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{cv.file_name}</p>
          <p className="text-xs text-muted-foreground">Przesłano {dateStr}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <label className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer" title="Zmień plik">
          <Upload className="w-4 h-4" />
          <input type="file" accept="application/pdf" onChange={onUpload} className="hidden" />
        </label>
        <button onClick={onRemove} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Usuń CV">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AiSection({ state, onStart, processing, errorMessage }: { state: CvState; onStart: () => void; processing: boolean; errorMessage: string | null }) {
  if (state === "empty") return null;

  if (state === "processing" || processing) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Przygotowywanie analizy AI…</p>
            <p className="text-xs text-muted-foreground mt-0.5">To może chwilę potrwać. Nie zamykaj tej strony.</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Nie udało się przygotować analizy</p>
            {errorMessage && <p className="text-xs text-destructive/70 mt-0.5 break-words">{errorMessage}</p>}
            <button
              onClick={onStart}
              disabled={processing}
              className="mt-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "needs_review") {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">CV przygotowane do analizy AI</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              W kolejnym kroku AI odczyta dane z Twojego CV i zaproponuje uzupełnienie profilu. Będziesz mógł wszystko sprawdzić i poprawić przed zapisaniem.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ready_for_ai or uploaded
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Uzupełnij profil z pomocą AI</p>
          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
              AI odczyta dane z Twojego CV
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
              Automatycznie uzupełni pola profilu
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
              Przed zapisaniem sprawdzisz i poprawisz wszystko ręcznie
            </li>
          </ul>
          <button
            onClick={onStart}
            disabled={processing}
            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <Sparkles className="w-4 h-4" />
            Uzupełnij profil z AI
          </button>
        </div>
      </div>
    </div>
  );
}
