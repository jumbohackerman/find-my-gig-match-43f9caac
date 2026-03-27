import { useState, useEffect } from "react";
import { Upload, FileText, Trash2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface CvRecord {
  id: string;
  file_name: string;
  file_path: string;
  status: string;
  created_at: string;
}

export default function CandidateCvUpload() {
  const { user } = useAuth();
  const [lastCv, setLastCv] = useState<CvRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingRecord, setLoadingRecord] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingRecord(false);
      return;
    }
    const load = async () => {
      const { data } = await (supabase as any)
        .from("cv_uploads")
        .select("id, file_name, file_path, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setLastCv(data as CvRecord | null);
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
      .select("id, file_name, file_path, status, created_at")
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
      toast.success("CV zostało usunięte.");
    } catch {
      toast.error("Nie udało się usunąć CV.");
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

  if (lastCv && !uploading) {
    const date = new Date(lastCv.created_at);
    const dateStr = date.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{lastCv.file_name}</p>
              <p className="text-xs text-muted-foreground">Przesłano {dateStr} · Status: {lastCv.status}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <label className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer" title="Zmień plik">
              <Upload className="w-4 h-4" />
              <input type="file" accept="application/pdf" onChange={handleUpload} className="hidden" />
            </label>
            <button onClick={handleRemove} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Usuń CV">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
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
    </div>
  );
}
