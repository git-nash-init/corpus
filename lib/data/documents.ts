import type { DocumentKind, DocumentRecord, LinkedType } from "./types";
import { documentFromRow } from "./mappers";
import type { Sb } from "./supabaseRepository";

export const MAX_DOC_BYTES = 20 * 1024 * 1024;

const BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
};

export const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx,.xls";

/** Browsers often leave file.type empty for csv and xls, so fall back to the extension. */
export function mimeOf(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const byExt = BY_EXT[ext];
  if (!byExt) return null;
  return file.type && Object.values(BY_EXT).includes(file.type) ? file.type : byExt;
}

export function validateDocument(file: File): string | null {
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_DOC_BYTES) return "Files can be up to 20 MB.";
  if (!mimeOf(file)) return "Upload a PDF, image (PNG, JPG, WebP), CSV or Excel file.";
  return null;
}

const safeName = (n: string) => n.replace(/[^\w.\- ]+/g, "_").replace(/\s+/g, "_").slice(-120);

export async function uploadDocument(
  sb: Sb,
  userId: string,
  file: File,
  meta: { kind: DocumentKind; linkedType?: LinkedType | null; linkedId?: string | null },
): Promise<DocumentRecord> {
  const problem = validateDocument(file);
  if (problem) throw new Error(problem);
  const mime = mimeOf(file)!;
  const path = `${userId}/${crypto.randomUUID()}-${safeName(file.name)}`;

  const up = await sb.storage.from("documents").upload(path, file, { contentType: mime, upsert: false });
  if (up.error) throw new Error(`Upload failed: ${up.error.message}`);

  const { data, error } = await sb
    .from("documents")
    .insert({ storage_path: path, file_name: file.name.slice(0, 255), mime, size: file.size, kind: meta.kind, linked_type: meta.linkedType ?? null, linked_id: meta.linkedId ?? null })
    .select("*")
    .single();
  if (error) {
    await sb.storage.from("documents").remove([path]);
    throw new Error(`Could not record the upload: ${error.message}`);
  }
  return documentFromRow(data);
}

/** A short-lived link to the file. Files are private, so every download needs one. */
export async function documentUrl(sb: Sb, doc: DocumentRecord, download = false): Promise<string> {
  const { data, error } = await sb.storage.from("documents").createSignedUrl(doc.storagePath, 120, download ? { download: doc.fileName } : undefined);
  if (error || !data) throw new Error("Could not open the file. Please try again.");
  return data.signedUrl;
}

export async function removeDocument(sb: Sb, doc: DocumentRecord): Promise<void> {
  const { error: fileError } = await sb.storage.from("documents").remove([doc.storagePath]);
  if (fileError) throw new Error(`Could not delete the file: ${fileError.message}`);
  const { error } = await sb.from("documents").delete().eq("id", doc.id);
  if (error) throw new Error(`Could not delete the record: ${error.message}`);
}

export const formatBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);
