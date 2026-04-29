import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Trash2, Loader2, AlertCircle, Sparkles, CheckCircle2, XCircle, Check } from "lucide-react";
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
  startAiParsing,
} from "@/lib/cvHelpers";
import { devLog } from "@/lib/logger";

type CvState = "empty" | "uploaded" | "ready_for_ai" | "processing" | "needs_review" | "ai_parsing" | "parsed" | "failed";

/** Whether the parsed data has already been imported into the profile form */
type ImportState = "not_imported" | "imported";

function hasParsedJson(parsed: CvParsedRecord | null): boolean {
  return !!(parsed?.parsed_json && typeof parsed.parsed_json === "object" && Object.keys(parsed.parsed_json as Record<string, unknown>).length > 0);
}

function deriveCvState(cv: CvRecord | null, parsed: CvParsedRecord | null): CvState {
  if (!cv) return "empty";
  // parsed_json takes priority over any status, including failed
  if (cv.status === "parsed" || hasParsedJson(parsed)) return "parsed";
  if (cv.status === "processing") return "processing";
  if (cv.status === "ai_processing") return "ai_parsing";
  if (cv.status === "failed") return "failed";
  if (cv.status === "needs_review" || parsed?.raw_text) return "needs_review";
  return "ready_for_ai";
}

interface CandidateCvUploadProps {
  onParsed?: (parsedJson: unknown) => void;
}

export default function CandidateCvUpload({ onParsed }: CandidateCvUploadProps = {}) {
  const { user } = useAuth();
  const [lastCv, setLastCv] = useState<CvRecord | null>(null);
  const [parsedData, setParsedData] = useState<CvParsedRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [aiProcessing, setAiProcessing] = useState(false);
  /** 0 = upload done, 1 = text extracted, 2 = AI parsed */
  const [parsingStep, setParsingStep] = useState(0);
  /** Tracks whether parsed data has been imported into the form in this session */
  const [importState, setImportState] = useState<ImportState>("not_imported");
  /** Hard ref-based guard: survives re-renders and prevents concurrent AI calls */
  const aiRequestInFlight = useRef(false);
  /** Tracks which cv_upload_id has already been successfully parsed */
  const parsedCvIds = useRef<Set<string>>(new Set());

  const cvState = deriveCvState(lastCv, parsedData);

  useEffect(() => {
    if (!user) {
      setLoadingRecord(false);
      return;
    }
    const load = async () => {
      const cv = await fetchLatestCv(user.id);
      if (cv) {
        const parsed = await fetchParsedData(cv.id);
        setParsedData(parsed);
        // Normalize local state: if parsed_json exists, treat as parsed regardless of stored status.
        // Do NOT call onParsed on mount — import only happens after explicit user action or fresh AI parse.
        if (hasParsedJson(parsed) && cv.status !== "parsed") {
          setLastCv({ ...cv, status: "parsed", error_message: null });
        } else {
          setLastCv(cv);
        }
      } else {
        setLastCv(null);
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
      setParsedData(null);
      setImportState("not_imported");
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
    devLog("[CvUpload] handleStartAi clicked", { cvId: lastCv?.id, aiProcessing, inFlight: aiRequestInFlight.current });

    if (!lastCv || !user) return;

    // Guard 1: ref-based in-flight check (survives re-renders)
    if (aiRequestInFlight.current) {
      devLog("[CvUpload] BLOCKED — AI request already in flight");
      return;
    }

    // Guard 2: state-based check
    if (aiProcessing) {
      devLog("[CvUpload] BLOCKED — aiProcessing state is true");
      return;
    }

    // Guard 3: already parsed for this cv_upload_id (in-memory cache)
    if (parsedCvIds.current.has(lastCv.id)) {
      devLog("[CvUpload] BLOCKED — cv_upload_id already parsed (local cache)");
      toast.info("CV zostało już przeanalizowane przez AI.");
      return;
    }

    // Guard 4: check DB for existing parsed data
    const existing = await fetchParsedData(lastCv.id);
    if (hasParsedJson(existing)) {
      devLog("[CvUpload] BLOCKED — parsed_json already exists in DB");
      parsedCvIds.current.add(lastCv.id);
      setParsedData(existing);
      setLastCv({ ...lastCv, status: "parsed", error_message: null });
      toast.info("CV zostało już przeanalizowane. Kliknij przycisk importu, aby wczytać dane do formularza.", { id: "cv-already-parsed" });
      // Do NOT call onParsed here — import must be explicit user action via import button
      return;
    }

    // Guard 5: check if status indicates processing in progress
    if (lastCv.status === "ai_processing" || lastCv.status === "processing") {
      devLog("[CvUpload] BLOCKED — CV is already being processed, status:", lastCv.status);
      toast.info("Analiza CV jest już w toku.");
      return;
    }

    // ── All guards passed — lock and start ──
    aiRequestInFlight.current = true;
    setAiProcessing(true);
    setParsingStep(0);
    devLog("[CvUpload] AI analysis STARTED for cv_upload_id:", lastCv.id);

    try {
      // If raw_text exists, skip extraction and go straight to AI parsing
      if (existing?.raw_text && existing.raw_text.length > 0) {
        setParsedData(existing);
        setLastCv({ ...lastCv, status: "ai_processing" });
        setParsingStep(1);

        const parseResult = await startAiParsing(lastCv.id, user.id);
        if (!parseResult.success) {
          setLastCv({ ...lastCv, status: "failed", error_message: parseResult.error || "Nieznany błąd" });
          toast.error("Analiza AI nie powiodła się: " + (parseResult.error || "Nieznany błąd"));
          return;
        }

        const refreshedParsed = await fetchParsedData(lastCv.id);
        parsedCvIds.current.add(lastCv.id);
        setParsedData(refreshedParsed);
        setLastCv({ ...lastCv, status: "parsed", error_message: null });
        setParsingStep(2);
        toast.success("AI przeanalizowało Twoje CV!");
        // Auto-import after fresh AI parse (user explicitly clicked analyze)
        if (hasParsedJson(refreshedParsed)) {
          onParsed?.(refreshedParsed!.parsed_json);
          setImportState("imported");
        }
        return;
      }

      // No raw_text yet — extract text first, then parse with AI
      setLastCv({ ...lastCv, status: "processing" });

      const extractResult = await startAiPreparation(lastCv.id, user.id, lastCv.file_path);
      if (!extractResult.success) {
        setLastCv({ ...lastCv, status: "failed", error_message: extractResult.error || "Nieznany błąd" });
        toast.error("Nie udało się odczytać CV: " + (extractResult.error || "Nieznany błąd"));
        return;
      }

      // Text extracted, now run AI parsing
      setLastCv({ ...lastCv, status: "ai_processing" });
      setParsingStep(1);

      const parseResult = await startAiParsing(lastCv.id, user.id);
      if (!parseResult.success) {
        setLastCv({ ...lastCv, status: "failed", error_message: parseResult.error || "Nieznany błąd" });
        toast.error("Analiza AI nie powiodła się: " + (parseResult.error || "Nieznany błąd"));
        return;
      }

      // Refresh state
      const refreshedParsed = await fetchParsedData(lastCv.id);
      parsedCvIds.current.add(lastCv.id);
      setParsedData(refreshedParsed);
      setLastCv({ ...lastCv, status: "parsed", error_message: null });
      setParsingStep(2);
      toast.success("AI przeanalizowało Twoje CV!");
      // Auto-import after fresh AI parse (user explicitly clicked analyze)
      if (hasParsedJson(refreshedParsed)) {
        onParsed?.(refreshedParsed!.parsed_json);
        setImportState("imported");
      }
    } finally {
      aiRequestInFlight.current = false;
      setAiProcessing(false);
      setParsingStep(0);
      devLog("[CvUpload] AI analysis FINISHED for cv_upload_id:", lastCv.id);
    }
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
      {lastCv && !uploading && (
        <AiSection
          state={cvState}
          onStart={handleStartAi}
          onImport={() => {
            if (parsedData && hasParsedJson(parsedData)) {
              onParsed?.(parsedData.parsed_json);
              setImportState("imported");
              toast.success("Dane z CV zostały zaimportowane do formularza.", { id: "cv-import-done" });
            }
          }}
          processing={aiProcessing}
          errorMessage={lastCv.error_message}
          importState={importState}
        />
      )}
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

function AiSection({ state, onStart, onImport, processing, errorMessage, importState }: { state: CvState; onStart: () => void; onImport: () => void; processing: boolean; errorMessage: string | null; importState: ImportState }) {
  if (state === "empty") return null;

  if (state === "processing") {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Odczytywanie treści z CV…</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pobieranie pliku i ekstrakcja tekstu.</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "ai_parsing" || processing) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">AI analizuje Twoje CV…</p>
            <p className="text-xs text-muted-foreground mt-0.5">Wyciąganie danych: umiejętności, doświadczenie, wykształcenie. To może potrwać kilkanaście sekund.</p>
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
            <p className="text-sm font-medium text-destructive">Nie udało się przeanalizować CV</p>
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

  if (state === "parsed") {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">CV zostało przeanalizowane przez AI</p>
            {importState === "imported" ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                Dane zostały zaimportowane do formularza. Sprawdź uzupełnione pola i zapisz profil.
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Analiza zakończona. Kliknij poniżej, aby zaimportować dane do formularza profilu.
                </p>
                <button
                  onClick={onImport}
                  className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Importuj dane do formularza
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === "needs_review") {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Tekst odczytany — uruchom analizę AI</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tekst z CV został odczytany. Kliknij poniżej, aby AI wyciągnęło uporządkowane dane: umiejętności, doświadczenie, wykształcenie i inne.
            </p>
            <button
              onClick={onStart}
              disabled={processing}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <Sparkles className="w-4 h-4" />
              Analizuj z AI
            </button>
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
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
              CV służy tylko do uzupełnienia profilu — pracodawcy go nie zobaczą
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
