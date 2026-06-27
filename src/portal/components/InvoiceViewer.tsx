import { Download, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { buildPdf, loadLetterhead, type InvoiceData } from './CommissionInvoice';

/** Read-only re-view of a previously generated invoice, rebuilt from its snapshot. */
export default function InvoiceViewer({ data, onClose }: { data: InvoiceData; onClose: () => void }) {
  const [letterhead, setLetterhead] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const lastUrl = useRef('');

  useEffect(() => {
    let cancelled = false;
    loadLetterhead().then((lh) => {
      if (cancelled) return;
      setLetterhead(lh);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loading) return;
    const doc = buildPdf(letterhead, data);
    const u = doc.output('bloburl') as unknown as string;
    if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
    lastUrl.current = u;
    setUrl(u);
  }, [loading, letterhead, data]);

  const download = () => buildPdf(letterhead, data).save(`Commission Invoice - ${data.customerName || 'Deal'}.pdf`);

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-slate-950/55 p-0 backdrop-blur-sm sm:p-5">
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.3)] sm:rounded-[0.5rem]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4" style={{ paddingTop: 'max(1rem, calc(1rem + env(safe-area-inset-top, 0px)))' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">Invoice</p>
            <h2 className="mt-0.5 text-xl font-black tracking-[-0.02em]">#{data.invoiceNumber} · {data.customerName}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden bg-slate-100 p-3">
          {loading || !url ? (
            <div className="flex h-full items-center justify-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <iframe title="Invoice" src={url} className="h-full w-full rounded-[0.4rem] border border-slate-200 bg-white" />
          )}
        </div>
        <div className="flex justify-end border-t border-slate-200 bg-white p-3">
          <button type="button" onClick={download} className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#153158]">
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
