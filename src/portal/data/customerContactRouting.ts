import type { Contractor, User } from './types.js';

const DAVID_GALAXY_PERA_PHONE = '4374293510';
const DAVID_RENOCHEFS_PHONE = '4374520636';

function normalize(value: string | undefined) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function getCustomerFacingConsultantPhone(
  contractor?: Contractor,
  _rep?: User
) {
  const contractorKey = normalize(
    `${contractor?.id ?? ''} ${contractor?.companyName ?? ''}`
  );

  if (
    contractorKey.includes('galaxyrenovations') ||
    contractorKey.includes('perahome')
  ) {
    return DAVID_GALAXY_PERA_PHONE;
  }

  if (
    contractorKey.includes('renochefs') ||
    contractorKey.includes('renochef')
  ) {
    return DAVID_RENOCHEFS_PHONE;
  }

  // Customer-facing emails must not fall back to the contractor phone.
  // Add future rep phone fields here when real team profiles are available.
  return '';
}
