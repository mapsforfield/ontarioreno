import { FileText } from 'lucide-react';
import { leadFilesFor } from '../../../lib/commercial-inquiry';
import type { Lead } from '../data/types';

/**
 * Files a lead uploaded, for whoever is allowed to open them.
 *
 * The links go through the login-gated `?quote_file=` route, which re-checks
 * the same rule on the server (`canOpenLeadFile`) and mints a five-minute link.
 * Nothing here is what protects a file; this only decides what to list.
 */
export default function LeadFiles({ lead, isAdmin }: { lead: Lead; isAdmin: boolean }) {
  const files = leadFilesFor(lead.quoteFiles, isAdmin);
  if (files.length === 0) return null;
  return (
    <div className="mt-3 rounded-[0.5rem] border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Files from this lead</p>
      <ul className="mt-2 space-y-1.5">
        {files.map((file) => (
          <li key={file.index}>
            <a
              href={`/api/leads?quote_file=1&lead=${encodeURIComponent(lead.id)}&i=${file.index}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[2.25rem] items-center gap-2 text-sm font-semibold text-[#1B3C6C] underline underline-offset-2"
            >
              <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="break-all">{file.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
