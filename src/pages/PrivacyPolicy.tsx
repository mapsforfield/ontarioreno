import LegalDocumentLayout from '../components/LegalDocumentLayout';

const sections = [
  {
    title: 'Introduction',
    paragraphs: [
      'OntarioReno provides renovation planning information, project review support, cost guidance, permit considerations, and next-step guidance for Ontario homeowners.',
      'This Privacy Policy explains how OntarioReno collects, uses, and protects personal information in connection with renovation inquiries, requested resources, and project review activity.',
    ],
  },
  {
    title: 'Information We Collect',
    paragraphs: [
      'Depending on how you use the site, OntarioReno may collect personal and project-related information such as:',
    ],
    bullets: [
      'Name, email address, and phone number',
      'Project type and property or location details',
      'Budget, timeline, and planning details',
      'Messages, form responses, and project notes you provide',
      'Basic website analytics and usage information where applicable',
    ],
  },
  {
    title: 'How We Use Information',
    bullets: [
      'Review project details and respond to inquiries',
      'Provide renovation planning guidance and requested information',
      'Send requested resources, such as guides or planning materials',
      'Coordinate the appropriate next step based on project requirements',
      'Improve the website, forms, and overall user experience',
    ],
  },
  {
    title: 'Sharing Information',
    paragraphs: [
      'We do not sell personal information. Information may be used to coordinate with relevant service providers where appropriate and only in connection with your renovation inquiry or requested next step.',
    ],
  },
  {
    title: 'Consent and Communication',
    paragraphs: [
      'By submitting a form on OntarioReno, you consent to being contacted regarding your renovation project, requested resource, or related next step based on the information you provide.',
      'If you do not want further communication, you can request that OntarioReno stop contacting you.',
    ],
  },
  {
    title: 'Data Retention',
    paragraphs: [
      'OntarioReno keeps information only as long as reasonably needed for project review, communication, records, and legitimate business purposes.',
    ],
  },
  {
    title: 'Security',
    paragraphs: [
      'OntarioReno uses reasonable safeguards to protect personal information. No website or online transmission can guarantee absolute security.',
    ],
  },
  {
    title: 'Access, Updates, and Contact',
    paragraphs: [
      'You may contact OntarioReno to request access to, correction of, or deletion of personal information where applicable.',
      'Contact: info@ontarioreno.ca',
    ],
  },
] as const;

export default function PrivacyPolicy() {
  return (
    <LegalDocumentLayout
      title="Privacy Policy"
      metaTitle="Privacy Policy | OntarioReno"
      metaDescription="Learn how OntarioReno collects, uses, and protects personal information related to renovation project reviews, planning guidance, and requested next steps."
      canonicalPath="/privacy-policy"
      eyebrow="Privacy Policy"
      intro="OntarioReno explains renovation costs, project requirements, permit considerations, and next steps for Ontario homeowners. This policy outlines how personal information is collected and used in support of that process."
      lastUpdated="April 28, 2026"
      sections={[...sections]}
    />
  );
}
