export type StrategyKey = 'slow' | 'bonus' | 'flip';

export type StrategyConfig = {
  strategy: StrategyKey;
  principal: number;
  annualRate: number;
  termYears: number;
  deferralMonths: 0 | 3 | 6;
  baseMonthlyPayment: number;
  annualBonusAmount?: number;
  flipPayoffMonth?: number;
};

export type MonthlyRecord = {
  month: number;
  startingBalance: number;
  payment: number;
  scheduledPayment: number;
  extraPayment: number;
  interest: number;
  principal: number;
  balanceAfterScheduled: number;
  endingBalance: number;
  isPayoffMonth: boolean;
};

export type StrategySummary = {
  strategy: StrategyKey;
  monthlyPayment: number;
  totalFinanced: number;
  effectivePrincipal: number;
  addedBalanceFromDeferral: number;
  totalPaid: number;
  totalInterest: number;
  remainingBalanceAfter24Months: number;
  payoffAmountAtMonth24: number;
  payoffTimelineMonths: number;
  schedule: MonthlyRecord[];
  interestSavedVsBaseline: number;
  monthsShavedVsBaseline: number;
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDuration(totalMonths: number) {
  const months = Math.max(0, Math.round(totalMonths));
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
  }

  if (remainingMonths === 0) {
    return `${years} year${years === 1 ? '' : 's'}`;
  }

  return `${years} year${years === 1 ? '' : 's'} ${remainingMonths} month${
    remainingMonths === 1 ? '' : 's'
  }`;
}

export function calculateFinancedAmountWithHST(renovationCost: number) {
  return roundCurrency(renovationCost * 1.13);
}

export function calculateDeferredPrincipal(
  financedAmount: number,
  annualRate: number,
  deferralMonths: 0 | 3 | 6
) {
  if (deferralMonths === 0) {
    return roundCurrency(financedAmount);
  }

  const monthlyRate = annualRate / 12;
  return roundCurrency(
    financedAmount * Math.pow(1 + monthlyRate, deferralMonths)
  );
}

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  numberOfPayments: number
) {
  if (numberOfPayments <= 0) {
    return 0;
  }

  if (annualRate === 0) {
    return roundCurrency(principal / numberOfPayments);
  }

  const monthlyRate = annualRate / 12;
  const factor = Math.pow(1 + monthlyRate, numberOfPayments);
  return roundCurrency(
    (principal * monthlyRate * factor) / (factor - 1)
  );
}

// Generates a monthly amortization schedule that can handle annual bonus payments
// and an early full-payoff event while preserving the original required payment.
export function generateAmortizationSchedule({
  strategy,
  principal,
  annualRate,
  termYears,
  baseMonthlyPayment,
  annualBonusAmount = 2000,
  flipPayoffMonth = 24,
}: StrategyConfig) {
  const monthlyRate = annualRate / 12;
  const maxMonths = termYears * 12 + 240;
  const schedule: MonthlyRecord[] = [];

  let balance = roundCurrency(principal);
  let totalPaid = 0;
  let totalInterest = 0;
  let remainingBalanceAfter24Months = 0;
  let payoffAmountAtMonth24 = 0;

  for (let month = 1; month <= maxMonths && balance > 0.009; month += 1) {
    const startingBalance = roundCurrency(balance);
    const interest = roundCurrency(startingBalance * monthlyRate);
    const scheduledPayment = roundCurrency(
      Math.min(baseMonthlyPayment, startingBalance + interest)
    );
    const principalFromScheduled = roundCurrency(
      Math.max(scheduledPayment - interest, 0)
    );
    const balanceAfterScheduled = roundCurrency(
      Math.max(startingBalance - principalFromScheduled, 0)
    );

    let extraPayment = 0;
    let endingBalance = balanceAfterScheduled;
    let isPayoffMonth = false;

    if (strategy === 'bonus' && month % 12 === 0 && endingBalance > 0) {
      extraPayment = roundCurrency(Math.min(annualBonusAmount, endingBalance));
      endingBalance = roundCurrency(Math.max(endingBalance - extraPayment, 0));
    }

    if (strategy === 'flip' && month === flipPayoffMonth && endingBalance > 0) {
      payoffAmountAtMonth24 = endingBalance;
      extraPayment = roundCurrency(extraPayment + endingBalance);
      endingBalance = 0;
      isPayoffMonth = true;
    }

    const payment = roundCurrency(scheduledPayment + extraPayment);
    const principal = roundCurrency(principalFromScheduled + extraPayment);

    if (month === 24) {
      remainingBalanceAfter24Months =
        strategy === 'flip' ? balanceAfterScheduled : endingBalance;
      if (strategy === 'flip' && payoffAmountAtMonth24 === 0) {
        payoffAmountAtMonth24 = balanceAfterScheduled;
      }
    }

    schedule.push({
      month,
      startingBalance,
      payment,
      scheduledPayment,
      extraPayment,
      interest,
      principal,
      balanceAfterScheduled,
      endingBalance,
      isPayoffMonth,
    });

    totalPaid = roundCurrency(totalPaid + payment);
    totalInterest = roundCurrency(totalInterest + interest);
    balance = endingBalance;
  }

  if (schedule.length < 24) {
    remainingBalanceAfter24Months = 0;
  }

  return {
    totalPaid: roundCurrency(totalPaid),
    totalInterest: roundCurrency(totalInterest),
    remainingBalanceAfter24Months: roundCurrency(remainingBalanceAfter24Months),
    payoffAmountAtMonth24: roundCurrency(payoffAmountAtMonth24),
    payoffTimelineMonths: schedule.length,
    schedule,
  };
}

export function summarizeStrategyResults({
  strategy,
  financedAmount,
  effectivePrincipal,
  annualRate,
  termYears,
  deferralMonths,
  baseMonthlyPayment,
}: {
  strategy: StrategyKey;
  financedAmount: number;
  effectivePrincipal: number;
  annualRate: number;
  termYears: number;
  deferralMonths: 0 | 3 | 6;
  baseMonthlyPayment: number;
}): StrategySummary {
  const addedBalanceFromDeferral = roundCurrency(effectivePrincipal - financedAmount);
  const result = generateAmortizationSchedule({
    strategy,
    principal: effectivePrincipal,
    annualRate,
    termYears,
    deferralMonths,
    baseMonthlyPayment,
  });

  return {
    strategy,
    monthlyPayment: baseMonthlyPayment,
    totalFinanced: financedAmount,
    effectivePrincipal,
    addedBalanceFromDeferral,
    totalPaid: result.totalPaid,
    totalInterest: roundCurrency(result.totalInterest + addedBalanceFromDeferral),
    remainingBalanceAfter24Months: result.remainingBalanceAfter24Months,
    payoffAmountAtMonth24: result.payoffAmountAtMonth24,
    payoffTimelineMonths: result.payoffTimelineMonths + deferralMonths,
    schedule: result.schedule,
    interestSavedVsBaseline: 0,
    monthsShavedVsBaseline: 0,
  };
}
