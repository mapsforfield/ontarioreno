import { useEffect, useState } from 'react';

type Answer = { key: string; questionLabel: string; value: string; valueLabel: string };

/**
 * The homeowner's own answers from the booking form, on the rep's prep sheet.
 *
 * The same data the admin-only Submissions drawer shows, read live from the
 * linked lead. Renders nothing for an appointment with no lead behind it
 * (hand-created in the portal, imported) — an empty box there would read as
 * "the homeowner skipped every question", which is not what happened.
 */
export default function HomeownerAnswers({ appointmentId }: { appointmentId: string }) {
  const [answers, setAnswers] = useState<Answer[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAnswers(null);
    (async () => {
      try {
        const res = await fetch(
          `/api/appointments?_resource=homeowner_answers&appointmentId=${encodeURIComponent(appointmentId)}`,
          { credentials: 'include' }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { linked?: boolean; answers?: Answer[] };
        if (!cancelled) setAnswers(data.linked ? data.answers ?? [] : []);
      } catch {
        // Leave the section out rather than show something wrong.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  if (!answers || answers.length === 0) return null;

  return (
    <div className="mt-3 rounded-[0.5rem] border border-[#c9d9eb] bg-white p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#32639b]">
        Homeowner&rsquo;s answers
      </p>
      <dl className="mt-2 divide-y divide-slate-100">
        {answers.map((a) => (
          <div key={a.key} className="grid gap-1 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,auto)] sm:gap-4">
            <dt className="text-xs font-bold text-slate-500">{a.questionLabel}</dt>
            <dd className="text-sm font-black text-slate-950 sm:text-right">
              {a.valueLabel || <span className="font-semibold italic text-slate-400">left blank</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
