// ─── Shared presentational pieces for the public consultation flows ───────────
//
// Lifted out of ConsultationFlow.tsx unchanged when the basement flow got its
// own screen order (see BasementBookingFlow.tsx). Two flows drawing the same
// card, the same progress bar and the same buttons from two copies is two
// things to keep in step, and the identity of these pages is the part that must
// not drift.

import { useState } from 'react';
import { ArrowLeft, CalendarDays, Check, ChevronDown } from 'lucide-react';
import { buildIcs, googleCalendarUrl, outlookCalendarUrl, type CalendarEvent } from '../../../lib/calendar-links';

export type Question = {
  key: string;
  label: string;
  help?: string;
  step: 1 | 2 | 3;
  options: Array<{ value: string; label: string }>;
};

export const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1B3C6C] focus:ring-4 focus:ring-blue-100';

export function fmtDate(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });
}
export function fmtDateShort(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}
export function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}


export function AddToCalendar({ event, uid }: { event: CalendarEvent; uid: string }) {
  const [open, setOpen] = useState(false);

  const downloadIcs = () => {
    // Apple Calendar and desktop Outlook both consume .ics; a blob download
    // avoids needing any server round-trip for the file.
    const blob = new Blob([buildIcs(event, uid)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ontarioreno-${uid}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const item = 'block w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-[#f6faff]';

  return (
    <div className="relative mt-5">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1B3C6C] px-4 py-3 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#f2f7ff]">
        <CalendarDays className="h-4 w-4" /> Add to Calendar
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-lg">
          <a className={item} href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}>
            Google Calendar
          </a>
          <button type="button" className={item} onClick={downloadIcs}>Apple Calendar (.ics)</button>
          <a className={item} href={outlookCalendarUrl(event)} target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}>
            Outlook (web)
          </a>
          <button type="button" className={item} onClick={downloadIcs}>Download .ics</button>
        </div>
      )}
    </div>
  );
}

export function Choice({ question, value, onPick }: { question: Question; value?: string; onPick: (v: string) => void }) {
  return (
    <div>
      <p className="mb-1 text-sm font-bold text-slate-700">{question.label}</p>
      {question.help && <p className="mb-3 text-xs leading-relaxed text-slate-500">{question.help}</p>}
      <div className="grid gap-2">
        {question.options.map((o) => {
          const on = value === o.value;
          return (
            <button key={o.value} type="button" onClick={() => onPick(o.value)}
              className={`flex items-center justify-between rounded-xl border-2 px-4 py-3.5 text-left text-sm font-bold transition ${
                on ? 'border-[#1B3C6C] bg-[#f2f7ff] text-[#1B3C6C]' : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}>
              {o.label}
              {on && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PrimaryButton({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest}
      className="w-full rounded-xl bg-[#1B3C6C] py-4 text-base font-bold text-white transition hover:bg-[#153158] disabled:cursor-not-allowed disabled:opacity-40">
      {children}
    </button>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{children}</p>;
}

/**
 * A photo banner seated at the top of the card.
 *
 * Optional, and passed by one screen: the basement flow's calendar, which is
 * the page someone lands on. Everywhere else this is absent and the header
 * renders exactly as it always has, on the page background above the card.
 */
export type ShellBanner = { src: string; alt: string };

export function Shell({ children, title, step, totalSteps = 5, onBack, banner }: {
  children: React.ReactNode; title?: string; step?: number; totalSteps?: number; onBack?: () => void;
  banner?: ShellBanner;
}) {
  const progressBar = step ? (
    <div className="mx-auto mb-5 flex max-w-[220px] gap-1.5">
      {Array.from({ length: totalSteps }, (_, n) => n + 1).map((i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[#1B3C6C]' : 'bg-slate-200'}`} />
      ))}
    </div>
  ) : null;

  if (banner) {
    // Banner and card are ONE panel: a single rounded, clipped container with
    // the photo at the top and the white content below it. The radius therefore
    // exists in one place and cannot be doubled or mismatched, and there is no
    // seam to line up because there are no two edges meeting — the white simply
    // starts where the photo stops.
    return (
      <div className="flex min-h-screen justify-center bg-[#f0f4f8] px-4 py-6 sm:items-center sm:py-12">
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-2xl shadow-xl">
            <div className="relative">
              <img
                src={banner.src}
                alt={banner.alt}
                // Cropped from the centre at every width. The source is wide and
                // its whole point is the diagonal seam between the unfinished
                // half and the finished one — an edge-anchored crop on a phone
                // shows one half and throws the comparison away.
                className="h-[168px] w-full object-cover object-center sm:h-[196px]"
              />
              {/* Seats the text without washing the photo out. Transparent
                  across the top third so the finished room still reads, then
                  deepening to the navy the rest of the page is built from. Tuned
                  against the bright half — it is the harder of the two, and what
                  holds there holds over the insulation. */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0f2544]/5 via-[#0f2544]/45 to-[#0f2544]/85" />
              <div className="absolute inset-x-0 bottom-0 px-5 pb-4 text-center">
                {/* The real mark, not the navy pill.
                    The pill exists so the wordmark reads against the pale grey
                    page everywhere else; on the photo there is no pale grey to
                    read against, and a navy block sitting on a photograph looks
                    like something pasted over it. The white logo goes straight
                    onto the image, with a drop shadow doing the pill's old job
                    of holding it away from whatever is behind it. */}
                <img
                  src="/logo-white.png"
                  alt="OntarioReno"
                  className="mx-auto mb-3 h-9 w-auto drop-shadow-lg sm:h-10"
                />
                {/* On the photo the unfilled segments need to read against a
                    dark ground rather than the page's pale grey. */}
                {step ? (
                  <div className="mx-auto mb-3 flex max-w-[220px] gap-1.5">
                    {Array.from({ length: totalSteps }, (_, n) => n + 1).map((i) => (
                      <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-white' : 'bg-white/30'}`}
                      />
                    ))}
                  </div>
                ) : null}
                {title && (
                  <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm sm:text-[1.75rem]">
                    {title}
                  </h1>
                )}
              </div>
            </div>
            <div className="relative bg-white p-5 text-center sm:p-6">
              {onBack && (
                <button type="button" onClick={onBack}
                  className="absolute left-4 top-3 flex items-center gap-1 text-xs font-bold text-slate-400 transition hover:text-slate-700">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
              )}
              {onBack && <div className="h-4" />}
              {children}
            </div>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" /> Free consultation · about 45 minutes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#f0f4f8] px-4 py-8 sm:items-center sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-5 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-[#1B3C6C] px-5 py-2">
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">OntarioReno</span>
          </div>
          {progressBar}
          {title && <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h1>}
        </div>
        <div className="relative rounded-2xl bg-white p-6 text-center shadow-xl sm:p-7">
          {onBack && (
            <button type="button" onClick={onBack}
              className="absolute left-4 top-4 flex items-center gap-1 text-xs font-bold text-slate-400 transition hover:text-slate-700">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          )}
          {onBack && <div className="h-4" />}
          {children}
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" /> Free consultation · about 45 minutes
        </p>
      </div>
    </div>
  );
}
