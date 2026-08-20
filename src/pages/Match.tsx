import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Home,
  ShieldCheck,
} from 'lucide-react';
import { buttonStyles, formStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

type PropertyType = 'Detached' | 'Semi-Detached' | 'Townhome' | 'Condo' | '';
type ProjectType =
  | 'Basement renovation'
  | 'Legal basement / secondary suite'
  | 'Garden suite'
  | 'Kitchen renovation'
  | 'Bathroom renovation'
  | 'Full home renovation'
  | 'Not sure yet'
  | '';
type FinancingApproach =
  | 'Paying cash'
  | 'Financing monthly'
  | 'Open to options'
  | 'Not sure'
  | '';
type BudgetRange = 'Under $50k' | '$50k-$100k' | '$100k+' | 'Not sure' | '';
type ContactTiming = 'Today' | 'Tomorrow' | 'This week' | 'Flexible' | '';

type IntakeData = {
  city: string;
  propertyType: PropertyType;
  address: string;
  projectType: ProjectType;
  currentState: string;
  separateEntrance: string;
  permitStatus: string;
  backyardSpace: string;
  zoningStatus: string;
  planningTimeline: string;
  financingApproach: FinancingApproach;
  budgetRange: BudgetRange;
  fullName: string;
  phone: string;
  email: string;
  contactTiming: ContactTiming;
};

type Option = {
  label: string;
  subtext?: string;
};

const TOTAL_STEPS = 6;

const initialData: IntakeData = {
  city: '',
  propertyType: '',
  address: '',
  projectType: '',
  currentState: '',
  separateEntrance: '',
  permitStatus: '',
  backyardSpace: '',
  zoningStatus: '',
  planningTimeline: '',
  financingApproach: '',
  budgetRange: '',
  fullName: '',
  phone: '',
  email: '',
  contactTiming: '',
};

const propertyTypeOptions: Option[] = [
  { label: 'Detached' },
  { label: 'Semi-Detached' },
  { label: 'Townhome' },
  { label: 'Condo' },
];

const ontarioCitySuggestions = [
  'Toronto',
  'Mississauga',
  'Brampton',
  'Hamilton',
  'Burlington',
  'Oakville',
  'Milton',
  'Kitchener',
  'Waterloo',
  'Cambridge',
  'London',
  'Ottawa',
];

const projectTypeOptions: Option[] = [
  {
    label: 'Basement renovation',
    subtext: 'Finish or upgrade your basement space',
  },
  {
    label: 'Legal basement / secondary suite',
    subtext: 'Create a rental-ready, code-compliant unit',
  },
  {
    label: 'Garden suite',
    subtext: 'Build a detached unit in your backyard',
  },
  {
    label: 'Kitchen renovation',
    subtext: 'Update layout, finishes, storage, or function',
  },
  {
    label: 'Bathroom renovation',
    subtext: 'Refresh or fully remodel your bathroom',
  },
  {
    label: 'Full home renovation',
    subtext: 'Plan a larger multi-room renovation',
  },
  {
    label: 'Not sure yet',
    subtext: 'We will keep the flow simple and help you narrow it down',
  },
];

const financingOptions: Option[] = [
  { label: 'Paying cash' },
  { label: 'Financing monthly' },
  { label: 'Open to options' },
  { label: 'Not sure' },
];

const budgetOptions: Option[] = [
  { label: 'Under $50k' },
  { label: '$50k-$100k' },
  { label: '$100k+' },
  { label: 'Not sure' },
];

const timingOptions: Option[] = [
  { label: 'Today' },
  { label: 'Tomorrow' },
  { label: 'This week' },
  { label: 'Flexible' },
];

const phoneDigits = (value: string) => value.replace(/\D/g, '');

const formatPhoneInput = (value: string) => {
  const digits = phoneDigits(value).slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const isFullQualificationProject = (projectType: ProjectType) =>
  projectType === 'Basement renovation' ||
  projectType === 'Legal basement / secondary suite' ||
  projectType === 'Garden suite';

function IntakeProgress({ step }: { step: number }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-700">
          Step {step} of {TOTAL_STEPS}
        </p>
        <p className="text-sm text-slate-500">
          {Math.round((step / TOTAL_STEPS) * 100)}% complete
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#1B3C6C_0%,#5694CF_100%)] transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StepLayout({
  step,
  title,
  helper,
  children,
}: {
  step: number;
  title: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="transition duration-300">
      <IntakeProgress step={step} />
      <div className="mt-8">
        <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
          {title}
        </h2>
        {helper && (
          <p className="mt-3 text-base leading-7 text-slate-600">{helper}</p>
        )}
      </div>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

function OptionCards({
  options,
  value,
  onChange,
  columns = 'sm:grid-cols-2',
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  columns?: string;
}) {
  return (
    <div className={cn('grid gap-3', columns)}>
      {options.map((option) => {
        const isSelected = value === option.label;

        return (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.label)}
            className={cn(
              'min-h-[92px] rounded-2xl border bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100',
              isSelected
                ? 'border-[#1B3C6C] bg-blue-50/70 shadow-[0_18px_38px_rgba(27,60,108,0.14)]'
                : 'border-slate-200'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold leading-6 text-slate-900">
                  {option.label}
                </p>
                {option.subtext && (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {option.subtext}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                  isSelected
                    ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                    : 'border-slate-300 bg-white text-transparent'
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Field({
  label,
  optional,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  optional?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className={formStyles.label}>
        {label}
        {optional && (
          <span className="ml-2 font-normal text-slate-400">Optional</span>
        )}
      </label>
      <input
        {...props}
        aria-invalid={error ? true : undefined}
        className={cn(
          formStyles.field,
          error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
          props.className
        )}
      />
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default function Match() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<IntakeData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<{ fullName?: boolean; phone?: boolean }>({});
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: '',
  });

  const currentStateOptions = useMemo<Option[]>(() => {
    if (data.projectType === 'Legal basement / secondary suite') {
      return [
        { label: 'Unfinished basement' },
        { label: 'Finished basement (needs conversion)' },
        { label: 'Not sure' },
      ];
    }

    if (data.projectType === 'Garden suite') {
      return [
        { label: 'Build new garden suite' },
        { label: 'Convert existing structure' },
        { label: 'Not sure' },
      ];
    }

    if (
      data.projectType === 'Kitchen renovation' ||
      data.projectType === 'Bathroom renovation' ||
      data.projectType === 'Full home renovation'
    ) {
      return [
        { label: 'Full remodel' },
        { label: 'Partial upgrade' },
        { label: 'Not sure' },
      ];
    }

    if (data.projectType === 'Not sure yet') {
      return [
        { label: 'I know the space I want to improve' },
        { label: 'I need guidance' },
        { label: 'Not sure' },
      ];
    }

    return [
      { label: 'Unfinished' },
      { label: 'Partially finished' },
      { label: 'Fully finished' },
      { label: 'Not sure' },
    ];
  }, [data.projectType]);

  const currentStateTitle = useMemo(() => {
    if (data.projectType === 'Legal basement / secondary suite') {
      return "What's your starting point?";
    }

    if (data.projectType === 'Garden suite') {
      return 'What are you planning?';
    }

    if (
      data.projectType === 'Kitchen renovation' ||
      data.projectType === 'Bathroom renovation' ||
      data.projectType === 'Full home renovation'
    ) {
      return 'What best describes your renovation?';
    }

    if (data.projectType === 'Not sure yet') {
      return 'Where are you in the planning process?';
    }

    return "What's the current state of your basement?";
  }, [data.projectType]);

  const updateData = <K extends keyof IntakeData>(
    key: K,
    value: IntakeData[K]
  ) => {
    setData((current) => ({
      ...current,
      [key]: value,
    }));
    setSubmitStatus({ type: null, message: '' });
  };

  const validateStep = () => {
    if (step === 1) return data.city.trim() && data.propertyType;
    if (step === 2) return data.projectType;
    if (step === 3) return data.currentState;
    if (step === 4) {
      if (data.projectType === 'Garden suite') {
        return data.backyardSpace && data.zoningStatus;
      }
      if (isFullQualificationProject(data.projectType)) {
        return data.separateEntrance && data.permitStatus;
      }
      return data.planningTimeline;
    }
    if (step === 5) return data.financingApproach && data.budgetRange;
    return (
      data.fullName.trim() &&
      phoneDigits(data.phone).length >= 10 &&
      data.contactTiming
    );
  };

  const nextStep = () => {
    if (!validateStep()) {
      setSubmitStatus({
        type: 'error',
        message: 'Please complete the required choices before continuing.',
      });
      return;
    }

    setSubmitStatus({ type: null, message: '' });
    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  };

  const prevStep = () => {
    setSubmitStatus({ type: null, message: '' });
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      setSubmitStatus({
        type: 'error',
        message:
          'Please add your name, phone number, and preferred contact time before we review the project.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    const payload = {
      projectType: data.projectType,
      budget: data.budgetRange,
      timeline: data.contactTiming,
      name: data.fullName.trim(),
      email: data.email.trim(),
      phone: phoneDigits(data.phone),
      message: [
        `City: ${data.city}`,
        `Property Type: ${data.propertyType}`,
        `Address: ${data.address || 'Not provided'}`,
        `Current State: ${data.currentState}`,
        `Separate Entrance: ${data.separateEntrance || 'N/A'}`,
        `Permit Status: ${data.permitStatus || data.zoningStatus || 'N/A'}`,
        `Backyard Space: ${data.backyardSpace || 'N/A'}`,
        `Planning Timeline: ${data.planningTimeline || 'N/A'}`,
        `Financing Approach: ${data.financingApproach}`,
        `Preferred Contact Time: ${data.contactTiming}`,
      ].join('\n'),
    };

    try {
      // The Apps Script has always received this form and emails "New Lead Just
      // Came In". Left exactly as it was — it is the notification the office
      // actually watches.
      await fetch(
        'https://script.google.com/macros/s/AKfycbyi1JG7OXDwCghiVQb2PaOEME7ZByUa8Mxl3N7xbTCCaL07Bdrx3h01dA4YisDPV_Yw/exec',
        {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify(payload),
        }
      );

      // ADDITIONALLY post to our own API, which creates the Lead and texts the
      // homeowner the booking form that matches their project type. Fired
      // alongside rather than instead: this form's leads used to live only in
      // an inbox, and losing that email to gain a text would be a bad trade.
      //
      // Failure here is swallowed on purpose. The submission has already
      // succeeded as far as the homeowner is concerned — the Apps Script has
      // it — so an error on our side must not show them a red banner or make
      // them submit twice.
      void fetch('/api/leads?flow=project_review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});

      setSubmitStatus({
        type: 'success',
        message:
          "We're reviewing your project now. You'll receive a call shortly to go over details and schedule your in-home assessment.",
      });
    } catch (error) {
      console.error(error);
      setSubmitStatus({
        type: 'error',
        message:
          'Something went wrong while submitting. Please try again or email info@ontarioreno.ca.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <StepLayout step={step} title="Tell us about your property">
          <Field
            label="City"
            placeholder="Hamilton, Mississauga, Burlington..."
            value={data.city}
            onChange={(event) => updateData('city', event.target.value)}
            autoComplete="address-level2"
            list="ontario-city-suggestions"
          />
          <datalist id="ontario-city-suggestions">
            {ontarioCitySuggestions.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>

          {data.city.trim() && (
            <div>
              <p className={formStyles.label}>Property type</p>
              <OptionCards
                options={propertyTypeOptions}
                value={data.propertyType}
                onChange={(value) =>
                  updateData('propertyType', value as PropertyType)
                }
              />
            </div>
          )}

          {data.propertyType && (
            <Field
              label="Add your address for more accurate results"
              optional
              placeholder="123 Main St"
              value={data.address}
              onChange={(event) => updateData('address', event.target.value)}
              autoComplete="street-address"
            />
          )}
        </StepLayout>
      );
    }

    if (step === 2) {
      return (
        <StepLayout
          step={step}
          title="What are you looking to build or renovate?"
        >
          <OptionCards
            options={projectTypeOptions}
            value={data.projectType}
            onChange={(value) => {
              updateData('projectType', value as ProjectType);
              updateData('currentState', '');
              updateData('separateEntrance', '');
              updateData('permitStatus', '');
              updateData('backyardSpace', '');
              updateData('zoningStatus', '');
              updateData('planningTimeline', '');
            }}
          />
        </StepLayout>
      );
    }

    if (step === 3) {
      return (
        <StepLayout step={step} title={currentStateTitle}>
          <OptionCards
            options={currentStateOptions}
            value={data.currentState}
            onChange={(value) => updateData('currentState', value)}
          />
        </StepLayout>
      );
    }

    if (step === 4) {
      if (data.projectType === 'Garden suite') {
        return (
          <StepLayout
            step={step}
            title="Let's check early feasibility"
            helper="This helps us assess feasibility and avoid wasted time on-site."
          >
            <div>
              <p className={formStyles.label}>
                Do you have space available in your backyard?
              </p>
              <OptionCards
                options={[{ label: 'Yes' }, { label: 'Not sure' }]}
                value={data.backyardSpace}
                onChange={(value) => updateData('backyardSpace', value)}
              />
            </div>

            <div>
              <p className={formStyles.label}>
                Have you looked into zoning or permits?
              </p>
              <OptionCards
                options={[
                  { label: 'Approved' },
                  { label: 'In progress' },
                  { label: 'Not yet' },
                  { label: 'Not sure' },
                ]}
                value={data.zoningStatus}
                onChange={(value) => updateData('zoningStatus', value)}
              />
            </div>
          </StepLayout>
        );
      }

      if (isFullQualificationProject(data.projectType)) {
        return (
          <StepLayout
            step={step}
            title="Let's check early feasibility"
            helper="This helps us assess feasibility and avoid wasted time on-site."
          >
            <div>
              <p className={formStyles.label}>
                Do you have a separate entrance?
              </p>
              <OptionCards
                options={[
                  { label: 'Yes' },
                  { label: 'No' },
                  { label: 'Not sure' },
                ]}
                value={data.separateEntrance}
                onChange={(value) => updateData('separateEntrance', value)}
              />
            </div>

            <div>
              <p className={formStyles.label}>
                Have you applied for permits yet?
              </p>
              <OptionCards
                options={[
                  { label: 'Approved' },
                  { label: 'In progress' },
                  { label: 'Not yet' },
                  { label: 'Not sure' },
                ]}
                value={data.permitStatus}
                onChange={(value) => updateData('permitStatus', value)}
              />
            </div>
          </StepLayout>
        );
      }

      return (
        <StepLayout
          step={step}
          title="Let's understand your timing"
          helper="This helps us assess feasibility and avoid wasted time on-site."
        >
          <div>
            <p className={formStyles.label}>Are you planning this soon?</p>
            <OptionCards
              options={[
                { label: 'Ready to start' },
                { label: '3-6 months' },
                { label: 'Just exploring' },
              ]}
              value={data.planningTimeline}
              onChange={(value) => updateData('planningTimeline', value)}
            />
          </div>
        </StepLayout>
      );
    }

    if (step === 5) {
      return (
        <StepLayout
          step={step}
          title="Let's talk budget and payment approach"
          helper="We'll use this to guide realistic options and avoid over- or under-quoting."
        >
          <div>
            <p className={formStyles.label}>
              How are you planning to approach this?
            </p>
            <OptionCards
              options={financingOptions}
              value={data.financingApproach}
              onChange={(value) =>
                updateData('financingApproach', value as FinancingApproach)
              }
            />
          </div>

          {data.financingApproach && (
            <div>
              <p className={formStyles.label}>
                Do you have a rough budget range in mind?
              </p>
              <OptionCards
                options={budgetOptions}
                value={data.budgetRange}
                onChange={(value) =>
                  updateData('budgetRange', value as BudgetRange)
                }
              />
            </div>
          )}
        </StepLayout>
      );
    }

    return (
      <StepLayout
        step={step}
        title="Let's review your project and plan next steps"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Full Name"
            placeholder="Jane Homeowner"
            value={data.fullName}
            onChange={(event) => updateData('fullName', event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, fullName: true }))}
            error={
              touched.fullName && !data.fullName.trim()
                ? 'Please enter your name.'
                : undefined
            }
            autoComplete="name"
          />
          <Field
            label="Phone Number"
            placeholder="(416) 123-4567"
            value={data.phone}
            onChange={(event) =>
              updateData('phone', formatPhoneInput(event.target.value))
            }
            onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
            error={
              touched.phone && phoneDigits(data.phone).length < 10
                ? 'Enter a valid 10-digit phone number.'
                : undefined
            }
            autoComplete="tel"
            inputMode="tel"
          />
        </div>

        <Field
          label="Email"
          optional
          type="email"
          placeholder="jane@example.com"
          value={data.email}
          onChange={(event) => updateData('email', event.target.value)}
          autoComplete="email"
        />

        <div>
          <p className={formStyles.label}>When's a good time to reach you?</p>
          <OptionCards
            options={timingOptions}
            value={data.contactTiming}
            onChange={(value) =>
              updateData('contactTiming', value as ContactTiming)
            }
            columns="sm:grid-cols-2"
          />
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
          <p className="font-semibold text-slate-900">
            We'll review your details and call to confirm your project and
            schedule your in-home assessment.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            No obligation. No pressure.
          </p>
        </div>
      </StepLayout>
    );
  };

  if (submitStatus.type === 'success') {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] text-slate-900">
              You're all set
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              {submitStatus.message}
            </p>
            {data.contactTiming === 'Today' && (
              <p className="mx-auto mt-4 max-w-xl rounded-2xl bg-blue-50 px-5 py-4 text-sm font-medium leading-6 text-[#1B3C6C]">
                If you selected "Today", expect a call within a few hours.
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setData(initialData);
                setStep(1);
                setSubmitStatus({ type: null, message: '' });
              }}
              className={cn(buttonStyles.secondary, 'mt-8')}
            >
              Start another request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] py-8 sm:py-12 lg:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-[#1B3C6C]">
            <Home className="h-4 w-4" />
            Guided Project Intake
          </div>
          <h1 className="mx-auto mt-6 max-w-[680px] text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-slate-900 sm:text-5xl sm:leading-[1.02]">
            Start with a proper project review.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            This project review helps determine your renovation scope, requirements, and the right next step based on your property and goals.
          </p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
            <aside className="bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-6 text-white sm:p-8">
              <div className="flex items-center gap-2 font-bold text-blue-200">
                <ShieldCheck className="h-6 w-6" />
                OntarioReno Verified
              </div>

              <h2 className="mt-8 text-2xl font-bold tracking-[-0.03em]">
                Designed to prevent bad renovation decisions.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                We assess your project first so you do not waste time moving in
                the wrong direction.
              </p>

              <div className="mt-7 space-y-3.5">
                {[
                  'Understand your project before major decisions begin',
                  'Identify permit and feasibility risks early',
                  'Align budget and financing realistically',
                  'Move toward the appropriate next step',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <p className="text-sm leading-6 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </aside>

            <main className="p-6 sm:p-8 lg:p-10">
              <div className="mb-8">
                <p className="text-sm leading-7 text-slate-500">
                  This structured intake helps us understand your project before recommending the right next step.
                </p>
                <div className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  <span>Submit your project details</span>
                  <span className="hidden text-slate-300 sm:inline">&bull;</span>
                  <span>Review key requirements and constraints</span>
                  <span className="hidden text-slate-300 sm:inline">&bull;</span>
                  <span>Determine the appropriate next step</span>
                </div>
              </div>

              {renderStep()}

              {submitStatus.type === 'error' && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {submitStatus.message}
                </div>
              )}

              <p className="mt-6 text-sm leading-7 text-slate-500">
                Your information is used to review your project and determine the appropriate next step based on your requirements. You may be contacted regarding your project based on the details you provide.
              </p>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={step === 1 || isSubmitting}
                  className={cn(
                    buttonStyles.secondary,
                    'w-full sm:w-auto',
                    step === 1 && 'invisible'
                  )}
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </button>

                {step < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
                  >
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
                  >
                    {isSubmitting ? 'Reviewing...' : 'Start Project Review'}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}



