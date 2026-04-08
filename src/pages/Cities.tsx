import { Helmet } from 'react-helmet-async';
import CitySelectorSection from '../components/CitySelectorSection';

export default function Cities() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Ontario Renovation Cities | OntarioReno</title>
        <meta
          name="description"
          content="Browse OntarioReno city guides for basement renovation costs, permits, and legal basement planning across Ontario cities."
        />
        <link rel="canonical" href="https://ontarioreno.ca/cities" />
      </Helmet>

      <CitySelectorSection mode="page" />
    </div>
  );
}
