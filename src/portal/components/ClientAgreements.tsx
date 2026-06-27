import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortalData } from '../data/store';

export default function ClientAgreements({ clientId }: { clientId: string }) {
  const { deals, clients, salesAgreements, getAppointmentsForClient, getAgreementLink } = usePortalData();
  const navigate = useNavigate();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const client = clients.find((c) => c.id === clientId);

  // A client's deals: those reached through the client's appointments, plus any
  // deal that shares the client's email/phone (covers "Convert to Deal").
  const dealIds = useMemo(() => {
    const ids = new Set<string>();
    deals.forEach((d) => { if (d.clientId === clientId) ids.add(d.id); }); // exact link
    getAppointmentsForClient(clientId).forEach((a) => { if (a.dealId) ids.add(a.dealId); });
    const email = client?.email?.trim().toLowerCase();
    const phone = client?.phone?.trim();
    if (email || phone) {
      deals.forEach((d) => {
        if ((email && d.email?.trim().toLowerCase() === email) || (phone && d.phone?.trim() === phone)) {
          ids.add(d.id);
        }
      });
    }
    return ids;
  }, [deals, clientId, client, getAppointmentsForClient]);

  const agreements = useMemo(
    () => salesAgreements
      .filter((a) => dealIds.has(a.dealId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [salesAgreements, dealIds],
  );

  const dealLabel = (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return 'Deal';
    return deal.projectType || deal.homeownerName || 'Deal';
  };

  const openAgreement = async (id: string, dealId: string) => {
    setOpeningId(id);
    const link = await getAgreementLink(id, dealId);
    setOpeningId(null);
    if (link) window.open(link, '_blank', 'noopener');
  };

  if (agreements.length === 0) return null;

  return (
    <section>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        Sales Agreements ({agreements.length})
      </p>
      <div className="space-y-2">
        {agreements.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-900" title={a.fileName}>{a.fileName}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {dealLabel(a.dealId)} · {new Date(a.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAgreement(a.id, a.dealId)}
              disabled={openingId === a.id}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb] disabled:opacity-50"
            >
              {openingId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
              View
            </button>
            <button
              type="button"
              onClick={() => navigate('/portal/deals', { state: { openDealId: a.dealId } })}
              className="hidden shrink-0 rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 sm:inline-flex"
            >
              Open deal
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
