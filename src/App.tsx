import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Basements from './pages/Basements';
import LegalSuites from './pages/LegalSuites';
import KitchenRenovations from './pages/KitchenRenovations';
import BathroomRenovations from './pages/BathroomRenovations';
import Costs from './pages/Costs';
import Match from './pages/Match';
import Financing from './pages/Financing';
import HamiltonGrant from './pages/HamiltonGrant';
import HamiltonBasementGrantAd from './pages/HamiltonBasementGrantAd';
import HamiltonSecondarySuiteGrant from './pages/HamiltonSecondarySuiteGrant';
import HamiltonPermitTimeline from './pages/HamiltonPermitTimeline';
import HamiltonBasementPermitNeed from './pages/HamiltonBasementPermitNeed';
import OntarioLegalBasementRequirements from './pages/OntarioLegalBasementRequirements';
import HamiltonPermitDelayAvoidance from './pages/HamiltonPermitDelayAvoidance';
import HamiltonBasementRenovationCost from './pages/HamiltonBasementRenovationCost';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="basements" element={<Basements />} />
          <Route path="legal-suites" element={<LegalSuites />} />
          <Route path="kitchen-renovations" element={<KitchenRenovations />} />
          <Route path="bathroom-renovations" element={<BathroomRenovations />} />
          <Route path="costs" element={<Costs />} />
          <Route path="match" element={<Match />} />
          <Route path="financing" element={<Financing />} />
          <Route path="hamilton-grant-guide" element={<HamiltonGrant />} />
          <Route path="hamilton-secondary-suite-grant" element={<HamiltonSecondarySuiteGrant />} />
          <Route path="hamilton-building-permit-timeline" element={<HamiltonPermitTimeline />} />
          <Route path="do-you-need-a-permit-for-a-basement-in-hamilton" element={<HamiltonBasementPermitNeed />} />
          <Route path="legal-basement-requirements-in-ontario" element={<OntarioLegalBasementRequirements />} />
          <Route path="how-to-avoid-building-permit-delays-in-hamilton" element={<HamiltonPermitDelayAvoidance />} />
          <Route path="basement-renovation-cost-hamilton" element={<HamiltonBasementRenovationCost />} />
          <Route path="hamilton-basement-grant" element={<HamiltonBasementGrantAd />}
          />
        </Route>
      </Routes>
    </Router>
  );
}
