import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Basements from './pages/Basements';
import LegalSuites from './pages/LegalSuites';
import KitchenRenovations from './pages/KitchenRenovations';
import BathroomRenovations from './pages/BathroomRenovations';
import Costs from './pages/Costs';
import Match from './pages/Match';
import Cities from './pages/Cities';
import Financing from './pages/Financing';
import HamiltonGrant from './pages/HamiltonGrant';
import HamiltonBasementGrantAd from './pages/HamiltonBasementGrantAd';
import HamiltonSecondarySuiteGrant from './pages/HamiltonSecondarySuiteGrant';
import HamiltonPermitTimeline from './pages/HamiltonPermitTimeline';
import HamiltonBasementPermitNeed from './pages/HamiltonBasementPermitNeed';
import OntarioLegalBasementRequirements from './pages/OntarioLegalBasementRequirements';
import HamiltonPermitDelayAvoidance from './pages/HamiltonPermitDelayAvoidance';
import HamiltonBasementRenovationCost from './pages/HamiltonBasementRenovationCost';
import MiltonBasementRenovation from './pages/MiltonBasementRenovation';
import MiltonBasementRenovationCost from './pages/MiltonBasementRenovationCost';
import MiltonLegalBasement from './pages/MiltonLegalBasement';
import MiltonBasementPermit from './pages/MiltonBasementPermit';
import BurlingtonBasementRenovation from './pages/BurlingtonBasementRenovation';
import BurlingtonBasementRenovationCost from './pages/BurlingtonBasementRenovationCost';
import BurlingtonLegalBasement from './pages/BurlingtonLegalBasement';
import BurlingtonBasementPermit from './pages/BurlingtonBasementPermit';
import MississaugaBasementRenovation from './pages/MississaugaBasementRenovation';
import MississaugaBasementRenovationCost from './pages/MississaugaBasementRenovationCost';
import MississaugaLegalBasement from './pages/MississaugaLegalBasement';
import MississaugaBasementPermit from './pages/MississaugaBasementPermit';
import BramptonBasementRenovation from './pages/BramptonBasementRenovation';
import BramptonBasementRenovationCost from './pages/BramptonBasementRenovationCost';
import BramptonLegalBasement from './pages/BramptonLegalBasement';
import BramptonBasementPermit from './pages/BramptonBasementPermit';
import AjaxBasementRenovation from './pages/AjaxBasementRenovation';
import AjaxBasementRenovationCost from './pages/AjaxBasementRenovationCost';
import AjaxLegalBasement from './pages/AjaxLegalBasement';
import AjaxBasementPermit from './pages/AjaxBasementPermit';
import PickeringBasementRenovation from './pages/PickeringBasementRenovation';
import PickeringBasementRenovationCost from './pages/PickeringBasementRenovationCost';
import PickeringLegalBasement from './pages/PickeringLegalBasement';
import PickeringBasementPermit from './pages/PickeringBasementPermit';
import WhitbyBasementRenovation from './pages/WhitbyBasementRenovation';
import WhitbyBasementRenovationCost from './pages/WhitbyBasementRenovationCost';
import WhitbyLegalBasement from './pages/WhitbyLegalBasement';
import WhitbyBasementPermit from './pages/WhitbyBasementPermit';
import OshawaBasementRenovation from './pages/OshawaBasementRenovation';
import OshawaBasementRenovationCost from './pages/OshawaBasementRenovationCost';
import OshawaLegalBasement from './pages/OshawaLegalBasement';
import OshawaBasementPermit from './pages/OshawaBasementPermit';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="basements" element={<Basements />} />
          <Route path="legal-suites" element={<LegalSuites />} />
          <Route path="kitchen-renovations" element={<KitchenRenovations />} />
          <Route path="bathroom-renovations" element={<BathroomRenovations />} />
          <Route path="costs" element={<Costs />} />
          <Route path="match" element={<Match />} />
          <Route path="cities" element={<Cities />} />
          <Route path="financing" element={<Financing />} />
          <Route path="hamilton-grant-guide" element={<HamiltonGrant />} />
          <Route path="hamilton-secondary-suite-grant" element={<HamiltonSecondarySuiteGrant />} />
          <Route path="hamilton-building-permit-timeline" element={<HamiltonPermitTimeline />} />
          <Route path="do-you-need-a-permit-for-a-basement-in-hamilton" element={<HamiltonBasementPermitNeed />} />
          <Route path="legal-basement-requirements-in-ontario" element={<OntarioLegalBasementRequirements />} />
          <Route path="how-to-avoid-building-permit-delays-in-hamilton" element={<HamiltonPermitDelayAvoidance />} />
          <Route path="basement-renovation-cost-hamilton" element={<HamiltonBasementRenovationCost />} />
          <Route path="basement-renovation-milton" element={<MiltonBasementRenovation />} />
          <Route path="basement-renovation-cost-milton" element={<MiltonBasementRenovationCost />} />
          <Route path="legal-basement-milton" element={<MiltonLegalBasement />} />
          <Route path="basement-permit-milton" element={<MiltonBasementPermit />} />
          <Route path="basement-renovation-burlington" element={<BurlingtonBasementRenovation />} />
          <Route path="basement-renovation-cost-burlington" element={<BurlingtonBasementRenovationCost />} />
          <Route path="legal-basement-burlington" element={<BurlingtonLegalBasement />} />
          <Route path="basement-permit-burlington" element={<BurlingtonBasementPermit />} />
          <Route path="basement-renovation-mississauga" element={<MississaugaBasementRenovation />} />
          <Route path="basement-renovation-cost-mississauga" element={<MississaugaBasementRenovationCost />} />
          <Route path="legal-basement-mississauga" element={<MississaugaLegalBasement />} />
          <Route path="basement-permit-mississauga" element={<MississaugaBasementPermit />} />
          <Route path="basement-renovation-brampton" element={<BramptonBasementRenovation />} />
          <Route path="basement-renovation-cost-brampton" element={<BramptonBasementRenovationCost />} />
          <Route path="legal-basement-brampton" element={<BramptonLegalBasement />} />
          <Route path="basement-permit-brampton" element={<BramptonBasementPermit />} />
          <Route path="basement-renovation-ajax" element={<AjaxBasementRenovation />} />
          <Route path="basement-renovation-cost-ajax" element={<AjaxBasementRenovationCost />} />
          <Route path="legal-basement-ajax" element={<AjaxLegalBasement />} />
          <Route path="basement-permit-ajax" element={<AjaxBasementPermit />} />
          <Route path="basement-renovation-pickering" element={<PickeringBasementRenovation />} />
          <Route path="basement-renovation-cost-pickering" element={<PickeringBasementRenovationCost />} />
          <Route path="legal-basement-pickering" element={<PickeringLegalBasement />} />
          <Route path="basement-permit-pickering" element={<PickeringBasementPermit />} />
          <Route path="basement-renovation-whitby" element={<WhitbyBasementRenovation />} />
          <Route path="basement-renovation-cost-whitby" element={<WhitbyBasementRenovationCost />} />
          <Route path="legal-basement-whitby" element={<WhitbyLegalBasement />} />
          <Route path="basement-permit-whitby" element={<WhitbyBasementPermit />} />
          <Route path="basement-renovation-oshawa" element={<OshawaBasementRenovation />} />
          <Route path="basement-renovation-cost-oshawa" element={<OshawaBasementRenovationCost />} />
          <Route path="legal-basement-oshawa" element={<OshawaLegalBasement />} />
          <Route path="basement-permit-oshawa" element={<OshawaBasementPermit />} />
          <Route path="hamilton-basement-grant" element={<HamiltonBasementGrantAd />}
          />
        </Route>
      </Routes>
    </Router>
  );
}
