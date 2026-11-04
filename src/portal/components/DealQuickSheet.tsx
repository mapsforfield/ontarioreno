import { CalendarClock, CalendarDays, Check, ChevronRight, Mail, MapPin, MessageSquare, Phone, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { addDaysIso, type DealAttention } from '../data/dealPriority';
import { formatCurrency } from '../data/selectors';
import type { Appointment, Deal, DealStatus } from '../data/types';

type Stage = { label: string; status: DealStatus };

type Props = {
  deal: Deal;
  stages: Stage[];
  attention: DealAttention | null;
  contractorName: string | null;
  repName: string | null;
  appointment?: Appointment;
  today: string;
  onClose: () => void;
  onMove: (status: DealStatus) => void;
  onSetFollowUp: (date: string) => void;
  onAddNote: (note: string) => void;
  onOpenFull: () => void;
};

const CLOSE_DRAG_PX = 90;

function formatDay(iso: string) {
  return new Intl.DateTimeFormat('en-CA', { weekday: 'short', month: 'short', day: 'numeric' }).format(
    new Date(`${iso}T12:00:00`)
  );
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
}

function formatNoteTime(iso: string) {
  return new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric' }).format(new Date(iso));
}

function ContactButton({ children, href, label, external }: { children: ReactNode; href: string | null; label: string; external?: boolean }) {
  const className = 'flex min-h-[3.75rem] flex-col items-center justify-center gap-1 rounded-[0.6rem] text-xs font-bold';
  if (!href) {
    return <span className={cn(className, 'bg-slate-50 text-slate-300')} aria-hidden="true">{children}{label}</span>;
  }
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={cn(className, 'bg-[#e8f1fb] text-[#1B3C6C]')}
    >
      {children}
      {label}
    </a>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[0.68rem] font-black uppercase tracking-[0.12em] text-slate-400">{children}</p>;
}

/**
 * Phones: everything a rep does to a deal between visits, in one thumb-reach
 * sheet — contact them, move the stage, book the next touch, jot a note. The
 * full deal window is one tap further and nothing has moved out of it.
 *
 * Marking Won takes a second tap. It starts a commission, and an accidental tap
 * on a phone is exactly why swipe actions were removed from these cards.
 */
export default function DealQuickSheet({
  deal,
  stages,
  attention,
  contractorName,
  repName,
  appointment,
  today,
  onClose,
  onMove,
  onSetFollowUp,
  onAddNote,
  onOpenFull,
}: Props) {
  const [note, setNote] = useState('');
  const [confirmWon, setConfirmWon] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const openStages = stages.filter((stage) => stage.status !== 'won' && stage.status !== 'lost');
  const currentIndex = openStages.findIndex((stage) => stage.status === deal.status);
  const isClosed = deal.status === 'won' || deal.status === 'lost';
  const phoneDigits = deal.phone.replace(/[^+\d]/g, '');
  const place = [deal.address, deal.city].filter(Boolean).join(', ');
  const notes = (deal.activity ?? []).slice(0, 3);
  const followUps = [
    { label: 'Tomorrow', date: addDaysIso(today, 1) },
    { label: '3 days', date: addDaysIso(today, 3) },
    { label: '1 week', date: addDaysIso(today, 7) },
  ];

  const saveNote = () => {
    if (!note.trim()) return;
    onAddNote(note);
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-end bg-slate-950/45 backdrop-blur-sm lg:hidden" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={deal.homeownerName}
        className="portal-sheet flex max-h-[92dvh] w-full flex-col rounded-t-[1rem] bg-white shadow-[0_-24px_80px_rgba(15,23,42,0.25)]"
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragStart.current === null ? 'transform 180ms ease-out' : undefined,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Pull the header down to dismiss. Only the header: the body has to
            stay free to scroll. */}
        <div
          className="shrink-0 touch-none px-4 pb-3 pt-2"
          onTouchStart={(event) => { dragStart.current = event.touches[0].clientY; }}
          onTouchMove={(event) => {
            if (dragStart.current === null) return;
            setDragY(Math.max(0, event.touches[0].clientY - dragStart.current));
          }}
          onTouchEnd={() => {
            dragStart.current = null;
            if (dragY > CLOSE_DRAG_PX) onClose();
            else setDragY(0);
          }}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="break-words text-xl font-black leading-tight text-slate-950">{deal.homeownerName}</h2>
              <p className="mt-0.5 break-words text-sm font-semibold text-slate-500">
                {[deal.city, deal.projectType].filter(Boolean).join(' · ')}
              </p>
              <p className="mt-1 text-lg font-black text-[#1B3C6C]">{formatCurrency(deal.estimatedJobValue)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {attention && (
            <p
              className={cn(
                'mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold',
                attention.level === 'urgent' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
              )}
            >
              {attention.reason}
            </p>
          )}
        </div>

        <div
          className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pt-1"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
        >
          <div className="grid grid-cols-4 gap-2">
            <ContactButton href={phoneDigits ? `tel:${phoneDigits}` : null} label="Call"><Phone className="h-5 w-5" /></ContactButton>
            <ContactButton href={phoneDigits ? `sms:${phoneDigits}` : null} label="Text"><MessageSquare className="h-5 w-5" /></ContactButton>
            <ContactButton href={deal.email ? `mailto:${deal.email}` : null} label="Email"><Mail className="h-5 w-5" /></ContactButton>
            <ContactButton
              href={place ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}` : null}
              label="Map"
              external
            >
              <MapPin className="h-5 w-5" />
            </ContactButton>
          </div>

          {appointment && (
            <div className="flex items-center gap-3 rounded-[0.6rem] bg-slate-50 px-3 py-2.5">
              <CalendarDays className="h-5 w-5 shrink-0 text-[#32639b]" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">
                  {formatDay(appointment.appointmentDate)}
                  {appointment.appointmentTime ? ` at ${formatTime(appointment.appointmentTime)}` : ''}
                </p>
                <p className="truncate text-xs font-semibold text-slate-500">Next consultation</p>
              </div>
            </div>
          )}

          <section>
            <SectionLabel>Stage</SectionLabel>
            <div className="mt-2 grid grid-cols-4 gap-1">
              {openStages.map((stage, index) => {
                const isCurrent = stage.status === deal.status;
                return (
                  <button
                    key={stage.status}
                    type="button"
                    aria-pressed={isCurrent}
                    disabled={isCurrent}
                    onClick={() => onMove(stage.status)}
                    className="min-w-0 pb-1 pt-1.5 text-center"
                  >
                    <span
                      className={cn(
                        'block h-1.5 rounded-full',
                        !isClosed && index <= currentIndex ? 'bg-[#1B3C6C]' : 'bg-slate-200'
                      )}
                    />
                    <span
                      className={cn(
                        'mt-1.5 block truncate text-[0.68rem] font-bold leading-tight max-[350px]:text-[0.62rem]',
                        isCurrent ? 'text-[#1B3C6C]' : 'text-slate-500'
                      )}
                    >
                      {stage.label.replace('Appointment ', '')}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={deal.status === 'won'}
                onClick={() => {
                  if (!confirmWon) { setConfirmWon(true); return; }
                  onMove('won');
                }}
                className={cn(
                  'min-h-11 rounded-[0.6rem] px-2 text-sm font-bold',
                  confirmWon || deal.status === 'won' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
                )}
              >
                {deal.status === 'won' ? 'Won' : confirmWon ? 'Tap again to confirm' : 'Mark won'}
              </button>
              <button
                type="button"
                disabled={deal.status === 'lost'}
                onClick={() => onMove('lost')}
                className={cn(
                  'min-h-11 rounded-[0.6rem] px-2 text-sm font-bold',
                  deal.status === 'lost' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                {deal.status === 'lost' ? 'Lost' : 'Mark lost'}
              </button>
            </div>
          </section>

          {!isClosed && (
            <section>
              <div className="flex items-center justify-between gap-3">
                <SectionLabel>Next follow-up</SectionLabel>
                {deal.nextFollowUpDate && (
                  <button type="button" onClick={() => onSetFollowUp('')} className="min-h-8 px-1 text-xs font-bold text-slate-400">
                    Clear
                  </button>
                )}
              </div>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-slate-800">
                <CalendarClock className="h-4 w-4 text-[#32639b]" />
                {deal.nextFollowUpDate ? formatDay(deal.nextFollowUpDate) : 'None booked'}
              </p>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {followUps.map((option) => {
                  const isPicked = deal.nextFollowUpDate === option.date;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      aria-pressed={isPicked}
                      onClick={() => onSetFollowUp(option.date)}
                      className={cn(
                        'min-h-11 rounded-[0.6rem] px-1 text-xs font-bold',
                        isPicked ? 'bg-[#1B3C6C] text-white' : 'bg-slate-100 text-slate-700'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
                <label className="relative flex min-h-11 cursor-pointer items-center justify-center rounded-[0.6rem] bg-slate-100 px-1 text-xs font-bold text-slate-700">
                  Pick date
                  <input
                    type="date"
                    min={today}
                    value={deal.nextFollowUpDate}
                    onChange={(event) => { if (event.target.value) onSetFollowUp(event.target.value); }}
                    onClick={(event) => {
                      try { (event.currentTarget as HTMLInputElement).showPicker?.(); } catch { /* older browsers */ }
                    }}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Pick a follow-up date"
                  />
                </label>
              </div>
            </section>
          )}

          <section>
            <SectionLabel>Notes</SectionLabel>
            <div className="mt-2 flex items-end gap-2">
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={1}
                placeholder="Add a note"
                aria-label="Add a note"
                className="min-h-11 flex-1 resize-none !rounded-[0.6rem] !px-3 !py-2.5"
              />
              <button
                type="button"
                onClick={saveNote}
                disabled={!note.trim()}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-[0.6rem] bg-[#1B3C6C] px-3.5 text-sm font-bold text-white disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
                Save
              </button>
            </div>
            {notes.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {notes.map((entry) => (
                  <li key={entry.id} className="rounded-[0.6rem] bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                    <span className="break-words">{entry.note}</span>
                    <span className="ml-2 text-xs font-semibold text-slate-400">{formatNoteTime(entry.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(repName || contractorName) && (
            <p className="text-xs font-semibold text-slate-500">
              {[repName, contractorName].filter(Boolean).join(' · ')}
            </p>
          )}

          <button
            type="button"
            onClick={onOpenFull}
            className="flex min-h-12 w-full items-center justify-center gap-1 rounded-[0.6rem] border border-slate-200 text-sm font-bold text-slate-700"
          >
            Open full deal
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
