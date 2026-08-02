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
      'Advertising measurement identifiers, described under Advertising and Measurement',
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
    title: 'Advertising and Measurement',
    paragraphs: [
      'OntarioReno advertises on Meta platforms, including Facebook and Instagram, and uses the Meta Pixel and Meta Conversions API to measure which advertisements lead to renovation inquiries.',
      'When you visit the site, cookies set by Meta record page views and actions such as submitting a consultation form or booking a consultation. When you submit a form, contact and location details you provide — name, email address, phone number, city, and province — are converted into an irreversible cryptographic code before being sent to Meta. Meta uses that code to determine whether a visit came from one of its advertisements and, where a match is found, to measure and improve advertising performance.',
      'This information is used for advertising measurement only. OntarioReno does not sell personal information and does not send Meta the details of your renovation project.',
      'You can limit this activity through your Facebook or Instagram ad settings, or by blocking cookies in your browser. Doing so does not affect your ability to use the site, submit a form, or book a consultation.',
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
      lastUpdated="July 31, 2026"
      sections={[...sections]}
    />
  );
}
