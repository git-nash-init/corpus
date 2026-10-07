"use client";

import { useMemo, useRef, useState } from "react";
import { Badge, EmptyState, PageHeader, Section } from "@/components/app/kit";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Field";
import { Reveal } from "@/components/motion/Reveal";
import { ACCEPT, documentUrl, formatBytes, removeDocument, uploadDocument, validateDocument } from "@/lib/data/documents";
import { formatDate } from "@/lib/engine/format";
import { DOCUMENT_KINDS, type DocumentKind, type DocumentRecord, type LinkedType } from "@/lib/data/types";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useApp } from "@/lib/state/useApp";
import { useStore } from "@/lib/state/store";

export default function DocumentsPage() {
  const { data } = useApp();
  const setDocuments = useStore((s) => s.setDocuments);
  const input = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<DocumentKind>("Statement");
  const [link, setLink] = useState("");
  const [filter, setFilter] = useState<"All" | DocumentKind>("All");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  const links = useMemo(() => {
    if (!data) return [];
    return [
      ...data.funds.map((f) => ({ key: `fund:${f.id}`, label: `Fund: ${f.name}` })),
      ...[...new Set(data.stockTxns.map((t) => t.ticker))].map((t) => ({ key: `stock:${t}`, label: `Stock: ${t}` })),
      ...data.fixedAssets.map((a) => ({ key: `fixed_asset:${a.id}`, label: `Asset: ${a.name}` })),
      ...data.liabilities.map((l) => ({ key: `liability:${l.id}`, label: `Loan: ${l.name}` })),
    ];
  }, [data]);

  if (!data) return null;

  const labelFor = (d: DocumentRecord) => links.find((l) => l.key === `${d.linkedType}:${d.linkedId}`)?.label ?? null;
  const shown = data.documents.filter((d) => filter === "All" || d.kind === filter);

  const upload = async (files: FileList | File[]) => {
    setError(null);
    const list = [...files];
    for (const f of list) {
      const problem = validateDocument(f);
      if (problem) return setError(`${f.name}: ${problem}`);
    }
    setBusy(true);
    const cut = link.indexOf(":");
    const [lt, li] = link ? [link.slice(0, cut), link.slice(cut + 1)] : [null, null];
    try {
      for (const f of list) {
        const rec = await uploadDocument(supabaseBrowser(), data.userId, f, { kind, linkedType: lt as LinkedType | null, linkedId: li });
        setDocuments((docs) => [rec, ...docs]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "The upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const open = async (d: DocumentRecord, download: boolean) => {
    setOpening(d.id);
    setError(null);
    try {
      const url = await documentUrl(supabaseBrowser(), d, download);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the file.");
    } finally {
      setOpening(null);
    }
  };

  const remove = async (d: DocumentRecord) => {
    if (!window.confirm(`Delete ${d.fileName}? This cannot be undone.`)) return;
    setError(null);
    try {
      await removeDocument(supabaseBrowser(), d);
      setDocuments((docs) => docs.filter((x) => x.id !== d.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the file.");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Private vault" title="Documents" subtitle="Keep statements, contract notes and deposit receipts next to the holdings they belong to. Files are private to you and only open through short-lived links." />

      <Reveal>
        <Section eyebrow="Add files" title="Upload">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
            }}
            className="rounded-[4px] border border-dashed p-5 sm:p-8"
            style={{ borderColor: drag ? "var(--brass)" : "var(--line-strong)", background: drag ? "var(--glass-brass-fill)" : "transparent" }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Type" value={kind} onChange={(e) => setKind(e.target.value as DocumentKind)}>
                {DOCUMENT_KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </SelectField>
              <SelectField label="Attach to (optional)" value={link} onChange={(e) => setLink(e.target.value)}>
                <option value="">Nothing in particular</option>
                {links.map((l) => (
                  <option key={l.key} value={l.key}>
                    {l.label}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Button variant="primary" onClick={() => input.current?.click()} disabled={busy}>
                {busy ? "Uploading" : "Choose files"}
              </Button>
              <span className="text-sm text-ink-3">or drop them here. PDF, images, CSV or Excel, up to 20 MB each.</span>
              <input ref={input} type="file" multiple accept={ACCEPT} className="sr-only" tabIndex={-1} aria-label="Choose files to upload" onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); e.target.value = ""; }} />
            </div>
          </div>
          {error ? (
            <p role="alert" className="mt-4 text-sm" style={{ color: "var(--loss)" }}>
              {error}
            </p>
          ) : null}
        </Section>
      </Reveal>

      <Reveal>
        <Section
          eyebrow="Your files"
          title={`${shown.length} ${shown.length === 1 ? "document" : "documents"}`}
          actions={
            <label className="flex items-center gap-2 text-sm text-ink-2">
              Show
              <select className="input !min-h-[40px] !w-auto" value={filter} onChange={(e) => setFilter(e.target.value as "All" | DocumentKind)}>
                <option>All</option>
                {DOCUMENT_KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
          }
          flush
        >
          {shown.length === 0 ? (
            <EmptyState title="No documents yet" body="Upload a statement or receipt and it will be stored privately in your vault." />
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {shown.map((d) => (
                <li key={d.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px]">{d.fileName}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
                      <Badge>{d.kind}</Badge>
                      <span className="num">{formatBytes(d.size)}</span>
                      <span>{formatDate(d.createdAt)}</span>
                      {labelFor(d) ? <span className="text-ink-2">{labelFor(d)}</span> : null}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void open(d, false)} disabled={opening === d.id}>
                      {opening === d.id ? "Opening" : "Open"}
                    </Button>
                    <Button size="sm" onClick={() => void open(d, true)} disabled={opening === d.id}>
                      Download
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void remove(d)} aria-label={`Delete ${d.fileName}`}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </Reveal>
    </div>
  );
}
