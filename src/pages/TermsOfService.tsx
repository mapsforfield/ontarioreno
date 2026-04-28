import LegalDocumentLayout from '../components/LegalDocumentLayout';

const sections = [
  {
    title: 'Introduction',
    paragraphs: [
      'By using OntarioReno, you agree to these Terms of Service.',
    ],
  },
  {
    title: 'Informational Purpose',
    paragraphs: [
      'OntarioReno provides renovation planning information, cost guidance, permit-related education, and project review support for homeowners.',
    ],
  },
  {
    title: 'Not a Contractor or Government Agency',
    paragraphs: [
      'OntarioReno is not a contractor, government agency, municipality, lender, or legal advisor.',
    ],
  },
  {
    title: 'No Guarantees',
    paragraphs: [
      'Costs, grants, permits, eligibility, timelines, and project outcomes can vary. Users should verify important details with municipalities, contractors, lenders, or other qualified professionals before making final decisions.',
    ],
  },
  {
    title: 'Project Review and Next Steps',
    paragraphs: [
      'Submitting project details allows OntarioReno to review the inquiry and determine the appropriate next step. It does not guarantee eligibility, contractor availability, grant approval, financing approval, or project acceptance.',
    ],
  },
  {
    title: 'Third-Party Services',
    paragraphs: [
      'Where appropriate, OntarioReno may help coordinate with relevant service providers. OntarioReno is not responsible for third-party work, pricing, contracts, warranties, approvals, or performance.',
    ],
  },
  {
    title: 'User Responsibilities',
    paragraphs: [
      'Users are responsible for providing accurate information and for making their own final renovation, financing, permit, and contractor decisions.',
    ],
  },
  {
    title: 'Website Content',
    paragraphs: [
      'Website content may change and may not always be complete, current, or applicable to every project.',
    ],
  },
  {
    title: 'Limitation of Liability',
    paragraphs: [
      'OntarioReno is not liable for losses, costs, delays, or decisions arising from reliance on website content, project guidance, or third-party services, except where liability cannot be excluded by law.',
    ],
  },
  {
    title: 'Contact',
    paragraphs: [
      'Questions about these Terms of Service can be sent to info@ontarioreno.ca.',
    ],
  },
] as const;

export default function TermsOfService() {
  return (
    <LegalDocumentLayout
      title="Terms of Service"
      metaTitle="Terms of Service | OntarioReno"
      metaDescription="Review OntarioReno's Terms of Service for renovation planning information, project review support, third-party coordination, and website use."
      canonicalPath="/terms-of-service"
      eyebrow="Terms of Service"
      intro="OntarioReno provides renovation planning information, project review support, and next-step guidance for homeowners. These terms explain how the site should be used and what users can expect."
      lastUpdated="April 28, 2026"
      sections={[...sections]}
    />
  );
}
