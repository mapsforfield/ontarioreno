import { Contractor, Deal } from './types';

export type ContractorRecommendation = {
  contractor: Contractor;
  label: 'Strong Fit' | 'Good Fit' | 'Possible Fit';
  reasons: string[];
  score: number;
};

function includesMatch(values: string[], target: string) {
  const normalizedTarget = target.toLowerCase();

  return values.some((value) => {
    const normalizedValue = value.toLowerCase();
    return (
      normalizedTarget.includes(normalizedValue) ||
      normalizedValue.includes(normalizedTarget)
    );
  });
}

export function getRecommendedContractors(
  deal: Deal,
  contractors: Contractor[]
): ContractorRecommendation[] {
  return contractors
    .filter((contractor) => contractor.contractorStatus === 'active')
    .map((contractor) => {
      const projectTypeMatch = includesMatch(
        contractor.projectTypes,
        deal.projectType
      );
      const serviceAreaMatch = includesMatch(contractor.serviceAreas, deal.city);
      const financingMatch = deal.financingRequired
        ? contractor.financingStatus === 'financing_available'
        : contractor.financingStatus !== 'pending_financing';
      const reasons: string[] = [];
      let score = contractor.priorityScore;

      if (contractor.financingStatus === 'financing_available') {
        reasons.push('Financing available');
      }

      if (!deal.financingRequired && contractor.financingStatus === 'cash_only') {
        reasons.push('Cash-ready contractor');
      }

      if (projectTypeMatch) {
        reasons.push('Matches project type');
        score += 18;
      }

      if (serviceAreaMatch) {
        reasons.push('Serves this area');
        score += 18;
      }

      if (financingMatch) {
        score += 22;
      } else if (deal.financingRequired) {
        score -= 35;
      }

      if (contractor.priorityScore >= 80) {
        reasons.push('High priority contractor');
        score += 8;
      }

      if (deal.financingRequired && contractor.financingStatus !== 'financing_available') {
        reasons.push('Financing not confirmed');
      }

      const label: ContractorRecommendation['label'] =
        score >= 130
          ? 'Strong Fit'
          : score >= 100
            ? 'Good Fit'
            : 'Possible Fit';

      return {
        contractor,
        label,
        reasons: reasons.length > 0 ? reasons : ['General network fit'],
        score,
      };
    })
    .filter(
      (recommendation) =>
        !deal.financingRequired ||
        recommendation.contractor.financingStatus === 'financing_available' ||
        recommendation.score >= 90
    )
    .sort((first, second) => second.score - first.score)
    .slice(0, 5);
}
