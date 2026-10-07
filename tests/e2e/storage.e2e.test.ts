import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { removeDocument, uploadDocument, documentUrl } from "@/lib/data/documents";

// Opt-in: CRORPUS_E2E=1 E2E_EMAIL=... E2E_PASSWORD=... npm run test -- tests/e2e
const enabled = process.env.CRORPUS_E2E === "1" && !!process.env.E2E_EMAIL && !!process.env.E2E_PASSWORD;

describe.skipIf(!enabled)("document vault storage", () => {
  it("uploads, signs, downloads and deletes, and keeps files private", async () => {
    const sb = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const login = await sb.auth.signInWithPassword({ email: process.env.E2E_EMAIL!, password: process.env.E2E_PASSWORD! });
    expect(login.error).toBeNull();
    const userId = login.data.user!.id;

    const file = new File([new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52])], "statement.pdf", { type: "application/pdf" });
    const doc = await uploadDocument(sb, userId, file, { kind: "Statement" });
    expect(doc.storagePath.startsWith(`${userId}/`)).toBe(true);
    expect(doc.size).toBe(8);

    // The owner can open it through a signed link.
    const url = await documentUrl(sb, doc, true);
    const res = await fetch(url);
    expect(res.status).toBe(200);
    expect((await res.arrayBuffer()).byteLength).toBe(8);

    // Anyone without a session cannot read the object, even with the exact path.
    const anon = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const anonRead = await anon.storage.from("documents").download(doc.storagePath);
    expect(anonRead.error).not.toBeNull();
    const publicUrl = await fetch(`${SUPABASE_URL}/storage/v1/object/public/documents/${doc.storagePath}`);
    expect(publicUrl.status).not.toBe(200);

    // A signed-in user cannot write into another user's folder.
    const trespass = await sb.storage.from("documents").upload("00000000-0000-0000-0000-000000000000/x.pdf", file, { contentType: "application/pdf" });
    expect(trespass.error).not.toBeNull();

    // Types and sizes outside the rules are rejected on the client before any upload.
    await expect(uploadDocument(sb, userId, new File(["x"], "virus.exe"), { kind: "Other" })).rejects.toThrow(/Upload a PDF/);

    await removeDocument(sb, doc);
    const gone = await sb.from("documents").select("id").eq("id", doc.id);
    expect(gone.data).toHaveLength(0);
  }, 60000);
});
