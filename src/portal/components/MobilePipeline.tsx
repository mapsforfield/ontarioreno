import { ChevronDown, Flame } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import type { DealAttention } from '../data/dealPriority';
import { formatCurrency } from '../data/selectors';
import type { Deal, DealStatus } from '../data/types';

export type PipelineStage = { label: string; status: DealStatus; deals: Deal[] };
export type StageRange = 'month' | 'quarter' | 'year' | 'all';

type Props = {
  stages: PipelineStage[];
  attentionDeals: Deal[];
  attentionOf: (deal: Deal) => DealAttention | null;
  /** When set, the pipeline gives way to a flat list of these. */
  searchResults: Deal[] | null;
  /** Null while a board-wide period is set: that replaces the Won/Lost ranges. */
  ranges: Partial<Record<DealStatus, { value: StageRange; onChange: (range: StageRange) => void }>> | null;
  onOpenDeal: (deal: Deal) => void;
};

type Section = DealStatus | 'attention';

const PREVIEW_ROWS = 6;
const RANGE_OPTIONS: Array<{ label: string; value: StageRange }> = [
  { label: 'Month', value: 'month' },
  { label: 'Quarter', value: 'quarter' },
  { label: 'Year', value: 'year' },
  { label: 'All', value: 'all' },
];
// Light to dark as a deal gets closer to signing.
const STAGE_COLOUR: Partial<Record<DealStatus, string>> = {
  new_lead: '#9dbbe0',
  appointment_booked: '#6592c9',
  quoted: '#32639b',
  negotiating: '#1B3C6C',
};

const sumValue = (deals: Deal[]) => deals.reduce((total, deal) => total + (deal.estimatedJobValue || 0), 0);

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase();
}

function DealRow({ deal, attention, onOpen, stageLabel }: { deal: Deal; attention: DealAttention | null; onOpen: () => void; stageLabel?: string }) {
  const place = [deal.city, deal.projectType].filter(Boolean).join(' · ');
  return (
    <button type="button" onClick={onOpen} className="flex min-h-[3.5rem] w-full items-center gap-3 px-3 py-2 text-left">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black',
          attention?.level === 'urgent'
            ? 'bg-red-50 text-red-600'
            : attention
              ? 'bg-amber-50 text-amber-700'
              : 'bg-[#e8f1fb] text-[#1B3C6C]'
        )}
      >
        {initials(deal.homeownerName)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-slate-900">{deal.homeownerName}</span>
        <span
          className={cn(
            'block truncate text-xs font-semibold',
            attention?.level === 'urgent' ? 'text-red-600' : attention ? 'text-amber-700' : 'text-slate-500'
          )}
        >
          {stageLabel ? `${stageLabel} · ` : ''}{attention?.reason ?? place}
        </span>
      </span>
      <span className="shrink-0 text-sm font-black tabular-nums text-[#1B3C6C]">{formatCurrency(deal.estimatedJobValue)}</span>
    </button>
  );
}

function DealList({ deals, attentionOf, onOpenDeal, children }: { deals: Deal[]; attentionOf: Props['attentionOf']; onOpenDeal: Props['onOpenDeal']; children?: ReactNode }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? deals : deals.slice(0, PREVIEW_ROWS);
  return (
    <div className="border-t border-slate-100">
      {children}
      {deals.length === 0 ? (
        <p className="px-3 py-5 text-center text-sm font-semibold text-slate-400">No deals here</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {visible.map((deal) => (
            <DealRow key={deal.id} deal={deal} attention={attentionOf(deal)} onOpen={() => onOpenDeal(deal)} />
          ))}
        </div>
      )}
      {deals.length > visible.length && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="min-h-11 w-full border-t border-slate-100 text-sm font-bold text-[#1B3C6C]"
        >
          Show all {deals.length}
        </button>
      )}
    </div>
  );
}

/**
 * Phones: the pipeline as one picture. Every stage, its count and its money are
 * on a single screen, joined up in the order a deal travels, and the deals stay
 * folded away until a stage is tapped. Only one opens at a time, so the page
 * never grows into a long scroll and it never moves sideways.
 */
export default function MobilePipeline({ stages, attentionDeals, attentionOf, searchResults, ranges, onOpenDeal }: Props) {
  const [open, setOpen] = useState<Section | null>(null);
  const sectionRefs = useRef<Partial<Record<Section, HTMLElement | null>>>({});

  // Closing a tall stage above can pull the one just opened off the top.
  useEffect(() => {
    if (!open) return;
    const element = sectionRefs.current[open];
    if (element && element.getBoundingClientRect().top < 72) {
      element.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [open]);

  if (searchResults) {
    const stageLabel = (deal: Deal) => stages.find((stage) => stage.status === deal.status)?.label.replace('Appointment ', '');
    return (
      <section className="overflow-hidden rounded-[0.75rem] bg-white shadow-sm">
        <p className="px-3 pb-1 pt-3 text-xs font-bold text-slate-500">
          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
        </p>
        <div className="divide-y divide-slate-100">
          {searchResults.map((deal) => (
            <DealRow key={deal.id} deal={deal} attention={attentionOf(deal)} stageLabel={stageLabel(deal)} onOpen={() => onOpenDeal(deal)} />
          ))}
        </div>
      </section>
    );
  }

  const openStages = stages.filter((stage) => STAGE_COLOUR[stage.status]);
  const closedStages = stages.filter((stage) => !STAGE_COLOUR[stage.status]);
  const openDeals = openStages.flatMap((stage) => stage.deals);
  const openValue = sumValue(openDeals);
  const largestStage = Math.max(1, ...openStages.map((stage) => sumValue(stage.deals)));
  const toggle = (section: Section) => setOpen((current) => (current === section ? null : section));
  const setRef = (section: Section) => (element: HTMLElement | null) => { sectionRefs.current[section] = element; };
  const openClosedStage = closedStages.find((stage) => stage.status === open);

  return (
    <section className="space-y-2.5">
      {/* The whole open pipeline in one bar: where the money is sitting. */}
      {openValue > 0 && (
        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
          {openStages.map((stage) => {
            const value = sumValue(stage.deals);
            if (value === 0) return null;
            return <span key={stage.status} style={{ flexGrow: value, backgroundColor: STAGE_COLOUR[stage.status] }} />;
          })}
        </div>
      )}

      {attentionDeals.length > 0 && (
        <div ref={setRef('attention')} className="scroll-mt-[4.5rem] overflow-hidden rounded-[0.75rem] bg-white shadow-sm">
          <button
            type="button"
            aria-expanded={open === 'attention'}
            onClick={() => toggle('attention')}
            className="flex min-h-12 w-full items-center gap-2.5 px-3 text-left"
          >
            <Flame className="h-4 w-4 shrink-0 text-red-500" />
            <span className="min-w-0 flex-1 text-sm font-black text-slate-900">
              {attentionDeals.length} need{attentionDeals.length === 1 ? 's' : ''} you today
            </span>
            <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open === 'attention' && 'rotate-180')} />
          </button>
          {open === 'attention' && <DealList deals={attentionDeals} attentionOf={attentionOf} onOpenDeal={onOpenDeal} />}
        </div>
      )}

      <div className="overflow-hidden rounded-[0.75rem] bg-white shadow-sm">
        {openStages.map((stage, index) => {
          const value = sumValue(stage.deals);
          const flagged = stage.deals.filter((deal) => attentionOf(deal)).length;
          const isOpen = open === stage.status;
          const colour = STAGE_COLOUR[stage.status];
          return (
            <div key={stage.status} ref={setRef(stage.status)} className="scroll-mt-[4.5rem]">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggle(stage.status)}
                className="relative flex min-h-[4.5rem] w-full items-center gap-3 px-3 text-left"
              >
                {/* The pipe: joins each stage to the next. */}
                {index > 0 && <span className="absolute left-[1.9rem] top-0 h-3 w-0.5 bg-slate-200" />}
                {index < openStages.length - 1 && <span className="absolute bottom-0 left-[1.9rem] h-3 w-0.5 bg-slate-200" />}
                <span
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-black tabular-nums text-white"
                  style={{ backgroundColor: colour }}
                >
                  {stage.deals.length}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[0.95rem] font-black text-slate-900">
                      {stage.label.startsWith('Appointment ') && <span className="max-[350px]:hidden">Appointment </span>}
                      {stage.label.replace('Appointment ', '')}
                    </span>
                    <span className="shrink-0 text-[0.95rem] font-black tabular-nums text-[#1B3C6C]">{formatCurrency(value)}</span>
                  </span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${Math.round((value / largestStage) * 100)}%`, backgroundColor: colour }}
                    />
                  </span>
                  {flagged > 0 && (
                    <span className="mt-1 block text-[0.7rem] font-bold leading-none text-red-600">{flagged} need{flagged === 1 ? 's' : ''} you</span>
                  )}
                </span>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
              </button>
              {isOpen && <DealList key={stage.status} deals={stage.deals} attentionOf={attentionOf} onOpenDeal={onOpenDeal} />}
            </div>
          );
        })}
      </div>

      {/* Where the pipe comes out. */}
      <div className="grid grid-cols-2 gap-2.5">
        {closedStages.map((stage) => {
          const isWon = stage.status === 'won';
          const isOpen = open === stage.status;
          return (
            <button
              key={stage.status}
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(stage.status)}
              className={cn(
                'min-h-[4.25rem] rounded-[0.75rem] px-3 py-2 text-left shadow-sm transition',
                isOpen
                  ? isWon ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'
                  : isWon ? 'bg-emerald-50 text-emerald-800' : 'bg-white text-slate-600'
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-black">{stage.label}</span>
                <span className="text-lg font-black tabular-nums">{stage.deals.length}</span>
              </span>
              <span className="mt-0.5 block truncate text-sm font-bold tabular-nums opacity-80">{formatCurrency(sumValue(stage.deals))}</span>
            </button>
          );
        })}
      </div>

      {openClosedStage && (
        <div ref={setRef(openClosedStage.status)} className="scroll-mt-[4.5rem] overflow-hidden rounded-[0.75rem] bg-white shadow-sm">
          <DealList key={openClosedStage.status} deals={openClosedStage.deals} attentionOf={attentionOf} onOpenDeal={onOpenDeal}>
            {ranges?.[openClosedStage.status] && (
              <div className="grid grid-cols-4 gap-1 p-2">
                {RANGE_OPTIONS.map((option) => {
                  const range = ranges[openClosedStage.status]!;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={range.value === option.value}
                      onClick={() => range.onChange(option.value)}
                      className={cn(
                        'min-h-9 rounded-[0.5rem] text-xs font-bold',
                        range.value === option.value ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </DealList>
        </div>
      )}
    </section>
  );
}
