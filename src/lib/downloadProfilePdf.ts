/**
 * Block 8 — Helper to fetch generated profile HTML and trigger print dialog.
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function downloadCandidateProfilePdf(candidateUserId: string) {
  try {
    const { data, error } = await supabase.functions.invoke("generate-pdf", {
      body: { type: "candidate_profile", id: candidateUserId },
    });
    if (error) throw error;
    const html = (data as any)?.html;
    if (!html) throw new Error("Brak danych do wygenerowania PDF");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Zablokowano popup. Zezwól na okna w przeglądarce, aby pobrać PDF.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    // Give the browser a tick to render before invoking print.
    setTimeout(() => {
      try { printWindow.focus(); printWindow.print(); } catch (e) { console.warn(e); }
    }, 250);
  } catch (e: any) {
    toast.error(`Nie udało się wygenerować PDF: ${e?.message || "spróbuj ponownie"}`);
  }
}
