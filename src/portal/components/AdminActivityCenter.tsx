import {
  Banknote,
  Bell,
  CalendarPlus,
  CheckCheck,
  ClipboardCheck,
  FileSignature,
  Hammer,
  Inbox,
  NotebookPen,
  Send,
  Sparkles,
  Trash2,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';
import type { Activity, User } from '../data/types';

const LAST_SEEN_KEY = 'admin_activity_lastSeen';

// Low-signal types excluded from the feed. 'deal_edited' fires on every deal
// save alongside a more specific activity (status change, note, etc.), so it
// would only add redundant noise.
const NOISE_TYPES = new Set(['deal_edited']);

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function titleCase(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

type Visual = {
  icon: typeof Bell;
  accent: string; // icon color
  ring: string; // icon bg
};

/** Maps an activity to a human predicate + an icon/colour. The actor's first
 *  name is rendered separately, so `text` starts with the verb. */
function describeActivity(activity: Activity): { text: string } & Visual {
  const label = activity.entityLabel || 'a record';
  const meta = activity.metadata ?? {};
  switch (activity.actionType) {
    case 'deal_status_changed': {
      const to = typeof meta.to === 'string' ? titleCase(meta.to) : 'a new stage';
      const won = meta.to === 'won';
      return {
        text: `moved ${label} to ${to}`,
        icon: won ? Trophy : TrendingUp,
        accent: won ? 'text-emerald-600' : 'text-[#1B3C6C]',
        ring: won ? 'bg-emerald-50' : 'bg-[#e8f1fb]',
      };
    }
    case 'consultation_outcome_submitted':
      return { text: `submitted an outcome report for ${label}`, icon: ClipboardCheck, accent: 'text-violet-600', ring: 'bg-violet-50' };
    case 'consultation_outcome_edited':
      return { text: `updated the outcome report for ${label}`, icon: ClipboardCheck, accent: 'text-violet-600', ring: 'bg-violet-50' };
    case 'deal_contractor_assigned': {
      const name = typeof meta.contractorName === 'string' ? meta.contractorName : 'a contractor';
      return { text: `assigned ${name} to ${label}`, icon: Hammer, accent: 'text-amber-600', ring: 'bg-amber-50' };
    }
    case 'contractor_dispatch_assigned':
      return { text: `confirmed a contractor for ${label}`, icon: Hammer, accent: 'text-amber-600', ring: 'bg-amber-50' };
    case 'contractor_dispatch_sent':
      return { text: `dispatched ${label} to a contractor`, icon: Send, accent: 'text-sky-600', ring: 'bg-sky-50' };
    case 'proposal_sent':
      return { text: `sent a proposal for ${label}`, icon: Send, accent: 'text-sky-600', ring: 'bg-sky-50' };
    case 'agreement_attached':
      return { text: `attached a signed agreement to ${label}`, icon: FileSignature, accent: 'text-emerald-600', ring: 'bg-emerald-50' };
    case 'deal_created':
    case 'deal_created_from_consultation':
      return { text: `created a deal — ${label}`, icon: Sparkles, accent: 'text-[#1B3C6C]', ring: 'bg-[#e8f1fb]' };
    case 'consultation_created':
      return { text: `booked a consultation — ${label}`, icon: CalendarPlus, accent: 'text-[#1B3C6C]', ring: 'bg-[#e8f1fb]' };
    case 'consultation_linked_to_deal':
      return { text: `linked a consultation to ${label}`, icon: CalendarPlus, accent: 'text-[#1B3C6C]', ring: 'bg-[#e8f1fb]' };
    case 'deal_activity_note_added':
      return { text: `added a note on ${label}`, icon: NotebookPen, accent: 'text-slate-600', ring: 'bg-slate-100' };
    case 'deal_follow_up_changed':
      return { text: `updated the follow-up date for ${label}`, icon: CalendarPlus, accent: 'text-slate-600', ring: 'bg-slate-100' };
    case 'commission_updated':
      return { text: `updated commission for ${label}`, icon: Banknote, accent: 'text-emerald-600', ring: 'bg-emerald-50' };
    case 'deal_deleted':
    case 'consultation_deleted':
      return { text: `deleted ${label}`, icon: Trash2, accent: 'text-red-600', ring: 'bg-red-50' };
    default:
      // Fall back to the stored human label, stripping a leading entity ref.
      return { text: activity.actionLabel || 'made an update', icon: Bell, accent: 'text-slate-600', ring: 'bg-slate-100' };
  }
}

function ActorAvatar({ actor, name }: { actor: User | undefined; name: string }) {
  if (actor?.avatarUrl) {
    return <img src={actor.avatarUrl} alt={name} className="h-full w-full object-cover" />;
  }
  return <span>{(actor?.avatarInitial ?? name[0] ?? '?').toUpperCase()}</span>;
}

export default function AdminActivityCenter({ variant }: { variant: 'desktop' | 'mobile' }) {
  const { isAdmin } = usePortalAuth();
  const { activities, users } = usePortalData();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<string>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(LAST_SEEN_KEY) : null;
    if (stored) return stored;
    // First ever visit — start the clock now so the feed doesn't flood with
    // historical activity. Only changes from this point forward count as new.
    const now = new Date().toISOString();
    try { localStorage.setItem(LAST_SEEN_KEY, now); } catch { /* ignore */ }
    return now;
  });
  // Snapshot of seenAt captured when the panel opens, used to highlight "new".
  const viewedFrom = useRef<string>(seenAt);

  // Only reps' actions matter to the admin — exclude the admin's own activity
  // and any system entries. Newest first (already sorted that way upstream).
  const repActivities = useMemo(
    () =>
      activities
        .filter((a) => a.actorRole === 'rep' && !NOISE_TYPES.has(a.actionType))
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [activities]
  );

  const unseenCount = useMemo(
    () => repActivities.filter((a) => a.createdAt > seenAt).length,
    [repActivities, seenAt]
  );

  const usersById = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of users) map.set(u.id, u);
    return map;
  }, [users]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!isAdmin) return null;

  const openPanel = () => {
    viewedFrom.current = seenAt; // freeze the "new" boundary for this viewing
    const now = new Date().toISOString();
    setSeenAt(now);
    try { localStorage.setItem(LAST_SEEN_KEY, now); } catch { /* ignore */ }
    setOpen(true);
  };

  const recent = repActivities.slice(0, 40);
  const newItems = recent.filter((a) => a.createdAt > viewedFrom.current);
  const earlierItems = recent.filter((a) => a.createdAt <= viewedFrom.current);

  const goToActivity = (a: Activity) => {
    setOpen(false);
    // Deep-link straight to the exact record the activity refers to.
    if (a.entityType === 'appointment' || a.actionType.startsWith('consultation')) {
      // Land on the tab the activity is about (outcome, dispatch, emails, …).
      const panelTab = a.actionType.includes('outcome')
        ? 'outcome'
        : a.actionType.includes('dispatch') || a.actionType.includes('proposal')
          ? 'dispatch'
          : a.actionType === 'email_sent'
            ? 'emails'
            : 'prep';
      navigate('/portal/appointments', { state: { openAppointmentId: a.entityId, panelTab } });
    } else if (a.entityType === 'deal' || a.dealId) {
      navigate('/portal/deals', { state: { openDealId: a.dealId || a.entityId } });
    } else if (a.entityType === 'contractor') {
      navigate('/portal/contractors');
    }
  };

  const renderItem = (a: Activity, isNew: boolean) => {
    const v = describeActivity(a);
    const actor = usersById.get(a.actorUserId);
    const firstName = a.actorName.split(' ')[0];
    const Icon = v.icon;
    return (
      <button
        key={a.id}
        type="button"
        onClick={() => goToActivity(a)}
        className={cn(
          'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50',
          isNew && 'bg-[#f3f8ff]'
        )}
      >
        <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1B3C6C] text-xs font-black text-white">
          <ActorAvatar actor={actor} name={a.actorName} />
          <span className={cn('absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white', v.ring)}>
            <Icon className={cn('h-2.5 w-2.5', v.accent)} />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-snug text-slate-700">
            <span className="font-black text-slate-950">{firstName}</span>{' '}
            {v.text}
          </span>
          <span className="mt-0.5 block text-xs font-semibold text-slate-400">
            {relativeTime(a.createdAt)}
          </span>
        </span>
        {isNew && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1B3C6C]" />}
      </button>
    );
  };

  const triggerClasses =
    variant === 'mobile'
      ? 'flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#1B3C6C]'
      : 'flex h-9 w-9 items-center justify-center rounded-full border border-white bg-white text-slate-600 shadow-sm transition hover:text-[#1B3C6C]';

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className={cn('relative', triggerClasses)}
        aria-label="Team activity"
        title="Team activity"
      >
        <Bell className="h-4 w-4" />
        {unseenCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[0.6rem] font-black text-white ring-2 ring-white">
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        )}
      </button>

      {open && createPortal(
        <>
          <button
            type="button"
            aria-label="Close activity"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[95] bg-slate-950/30 backdrop-blur-[2px]"
          />
          <div
            className={cn(
              'fixed z-[96] flex flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]',
              // Mobile: bottom sheet
              'inset-x-0 bottom-0 max-h-[82vh] rounded-t-[1.25rem]',
              // Desktop: anchored top-right card
              'sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-[4.75rem] sm:w-[24rem] sm:max-h-[34rem] sm:rounded-[1rem]'
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#32639b]">
                  Team Activity
                </p>
                <p className="mt-0.5 text-base font-black tracking-[-0.01em] text-slate-950">
                  {newItems.length > 0
                    ? `${newItems.length} new update${newItems.length !== 1 ? 's' : ''}`
                    : 'You’re all caught up'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Inbox className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-slate-600">No rep activity yet</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    When your reps move deals, log outcomes, or update records, you’ll see it here.
                  </p>
                </div>
              ) : (
                <>
                  {newItems.length > 0 && (
                    <>
                      <p className="bg-white px-4 pt-3 pb-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#1B3C6C]">
                        New since your last visit
                      </p>
                      {newItems.map((a) => renderItem(a, true))}
                    </>
                  )}
                  {earlierItems.length > 0 && (
                    <>
                      <p className="flex items-center gap-1.5 bg-white px-4 pt-3 pb-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-400">
                        {newItems.length > 0 && <CheckCheck className="h-3 w-3" />}
                        Earlier
                      </p>
                      {earlierItems.map((a) => renderItem(a, false))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
