import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from "pdfjs-dist";

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

const MIN_RAW_TEXT_LENGTH = 30;

/**
 * Download a file from a private Supabase storage bucket using a signed URL.
 */
export async function downloadFromBucket(
  bucket: string,
  filePath: string
): Promise<ArrayBuffer> {
  const { data: signedData, error: signedErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 120); // 2 min

  if (signedErr || !signedData?.signedUrl) {
    throw new Error("Nie udało się uzyskać dostępu do pliku CV: " + (signedErr?.message ?? "brak URL"));
  }

  const resp = await fetch(signedData.signedUrl);
  if (!resp.ok) {
    throw new Error(`Nie udało się pobrać pliku CV (HTTP ${resp.status})`);
  }
  return resp.arrayBuffer();
}

/**
 * Extract text from a PDF ArrayBuffer using pdf.js.
 * Returns the concatenated text from all pages.
 */
export async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str ?? "")
      .join(" ");
    pageTexts.push(pageText.trim());
  }

  return pageTexts.join("\n\n").trim();
}

/**
 * Validate that the extracted text meets quality thresholds.
 * Returns an error message if the text is too short or looks like garbage.
 */
export function validateExtractedText(text: string): string | null {
  if (!text || text.length < MIN_RAW_TEXT_LENGTH) {
    return "Nie udało się odczytać tekstu z pliku PDF. Plik może być skanem lub nie zawiera warstwy tekstowej. Spróbuj wrzucić CV w formacie tekstowym (nie skanowanym).";
  }

  // Check if text is mostly non-printable / garbled
  const printableRatio =
    text.replace(/[^\x20-\x7E\u00C0-\u024F\u0100-\u017F\u0400-\u04FF\s]/g, "").length /
    text.length;
  if (printableRatio < 0.5) {
    return "Treść odczytana z CV wygląda na uszkodzoną lub nieczytelną. Upewnij się, że plik PDF zawiera tekst (nie jest skanem obrazu).";
  }

  return null; // text is OK
}
