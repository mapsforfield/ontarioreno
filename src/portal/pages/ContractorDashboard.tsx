// The contractor's landing page (PJ at Galaxy): everything on one screen.
//
// Payments first — what is owed and when, in full — then the consultation
// calendar he was already used to landing on, unchanged. Each still has its own
// page in the sidebar; this is the two together so logging in doesn't drop him
// somewhere unfamiliar.

import { usePortalAuth } from '../auth';
import { PaymentsOverview } from './ContractorPayments';
import ContractorCalendar from './ContractorCalendar';
import { torontoToday } from '../lib/time';

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-CA', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Toronto' }).format(new Date())
  );
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export default function ContractorDashboard() {
  const { currentUser } = usePortalAuth();
  const [y, m, d] = torontoToday().split('-').map(Number);
  const todayLabel = new Date(y, m - 1, d).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">{todayLabel}</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.02em] text-slate-950">
          {greeting()}{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}.
        </h1>
      </header>

      <section>
        <PaymentsOverview compact />
      </section>

      <section>
        <ContractorCalendar />
      </section>
    </div>
  );
}
