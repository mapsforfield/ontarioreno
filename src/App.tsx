import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Basements from './pages/Basements';
import LegalSuites from './pages/LegalSuites';
import GardenSuitesLanewaySuitesOntario from './pages/GardenSuitesLanewaySuitesOntario';
import GardenSuiteCostOntario from './pages/GardenSuiteCostOntario';
import GardenSuitePermitsOntario from './pages/GardenSuitePermitsOntario';
import LanewaySuiteCostOntario from './pages/LanewaySuiteCostOntario';
import LanewaySuitePermitsOntario from './pages/LanewaySuitePermitsOntario';
import KitchenRenovations from './pages/KitchenRenovations';
import BathroomRenovations from './pages/BathroomRenovations';
import Costs from './pages/Costs';
import Match from './pages/Match';
import Cities from './pages/Cities';
import Financing from './pages/Financing';
import HomeEquityRenovationsOntario from './pages/HomeEquityRenovationsOntario';
import HelocVsRefinanceForRenovations from './pages/HelocVsRefinanceForRenovations';
import HelocForLegalBasementApartment from './pages/HelocForLegalBasementApartment';
import GardenSuiteFinancingOntario from './pages/GardenSuiteFinancingOntario';
import HelocVsRenovationFinancing from './pages/HelocVsRenovationFinancing';
import PhasedRenovationFinancing from './pages/PhasedRenovationFinancing';
import GrantsAndIncentivesWithHomeEquity from './pages/GrantsAndIncentivesWithHomeEquity';
import OpenLoanFinancing from './pages/OpenLoanFinancing';
import GrantEligibilityCalculator from './pages/GrantEligibilityCalculator';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
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
import BarrieBasementRenovation from './pages/BarrieBasementRenovation';
import BurlingtonBasementRenovationCost from './pages/BurlingtonBasementRenovationCost';
import BurlingtonLegalBasement from './pages/BurlingtonLegalBasement';
import BurlingtonBasementPermit from './pages/BurlingtonBasementPermit';
import BurlingtonAruIncentiveProgram from './pages/BurlingtonAruIncentiveProgram';
import BarrieSecondarySuiteFunding from './pages/BarrieSecondarySuiteFunding';
import BarrieBasementApartmentPermits from './pages/BarrieBasementApartmentPermits';
import BarrieGardenSuites from './pages/BarrieGardenSuites';
import BarrieAruPermitRebate from './pages/BarrieAruPermitRebate';
import BarrieSecondarySuiteCosts from './pages/BarrieSecondarySuiteCosts';
import BarrieAruEligibility from './pages/BarrieAruEligibility';
import StCatharines from './pages/StCatharines';
import StCatharinesAduGrant from './pages/StCatharinesAduGrant';
import StCatharinesAduCost from './pages/StCatharinesAduCost';
import StCatharinesAduPermits from './pages/StCatharinesAduPermits';
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
import ContractorPartners from './pages/ContractorPartners';
import { PortalAuthProvider } from './portal/auth';
import { PortalGuard } from './portal/components/PortalGuard';
import { PortalDataProvider } from './portal/data/store';
import PortalLayout from './portal/components/PortalLayout';
import PortalAdmin from './portal/pages/PortalAdmin';
import PortalCommissions from './portal/pages/PortalCommissions';
import PortalContractors from './portal/pages/PortalContractors';
import PortalDashboard from './portal/pages/PortalDashboard';
import PortalDeals from './portal/pages/PortalDeals';
import PortalLeaderboard from './portal/pages/PortalLeaderboard';
import PortalLogin from './portal/pages/PortalLogin';

export default function App() {
  return (
    <PortalDataProvider>
      <PortalAuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route element={<PortalGuard />}>
            <Route path="/portal" element={<PortalLayout />}>
              <Route index element={<PortalDashboard />} />
              <Route path="dashboard" element={<PortalDashboard />} />
              <Route path="contractors" element={<PortalContractors />} />
              <Route path="deals" element={<PortalDeals />} />
              <Route path="leaderboard" element={<PortalLeaderboard />} />
              <Route path="commissions" element={<PortalCommissions />} />
              <Route element={<PortalGuard adminOnly />}>
                <Route path="admin" element={<PortalAdmin />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="basements" element={<Basements />} />
          <Route path="legal-suites" element={<LegalSuites />} />
          <Route
            path="garden-suites"
            element={<GardenSuitesLanewaySuitesOntario />}
          />
          <Route
            path="garden-suites-laneway-suites-ontario"
            element={<GardenSuitesLanewaySuitesOntario />}
          />
          <Route
            path="garden-suite-cost-ontario"
            element={<GardenSuiteCostOntario />}
          />
          <Route
            path="garden-suite-permits-ontario"
            element={<GardenSuitePermitsOntario />}
          />
          <Route
            path="laneway-suite-cost-ontario"
            element={<LanewaySuiteCostOntario />}
          />
          <Route
            path="laneway-suite-permits-ontario"
            element={<LanewaySuitePermitsOntario />}
          />
          <Route path="kitchen-renovations" element={<KitchenRenovations />} />
          <Route path="bathroom-renovations" element={<BathroomRenovations />} />
          <Route path="costs" element={<Costs />} />
          <Route path="match" element={<Match />} />
          <Route path="cities" element={<Cities />} />
          <Route path="financing" element={<Financing />} />
          <Route
            path="financing/home-equity-renovations-ontario"
            element={<HomeEquityRenovationsOntario />}
          />
          <Route
            path="financing/heloc-vs-refinance-for-renovations"
            element={<HelocVsRefinanceForRenovations />}
          />
          <Route
            path="financing/heloc-for-legal-basement-apartment"
            element={<HelocForLegalBasementApartment />}
          />
          <Route
            path="financing/garden-suite-financing-ontario"
            element={<GardenSuiteFinancingOntario />}
          />
          <Route
            path="financing/heloc-vs-contractor-financing"
            element={<HelocVsRenovationFinancing />}
          />
          <Route
            path="financing/phased-renovation-financing"
            element={<PhasedRenovationFinancing />}
          />
          <Route
            path="financing/grants-and-incentives-with-home-equity"
            element={<GrantsAndIncentivesWithHomeEquity />}
          />
          <Route path="open-loan-financing" element={<OpenLoanFinancing />} />
          <Route path="grant-eligibility-calculator" element={<GrantEligibilityCalculator />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-of-service" element={<TermsOfService />} />
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
          <Route path="basement-renovation-barrie" element={<BarrieBasementRenovation />} />
          <Route path="basement-renovation-cost-burlington" element={<BurlingtonBasementRenovationCost />} />
          <Route path="legal-basement-burlington" element={<BurlingtonLegalBasement />} />
          <Route path="basement-permit-burlington" element={<BurlingtonBasementPermit />} />
          <Route path="burlington-aru-incentive-program" element={<BurlingtonAruIncentiveProgram />} />
          <Route path="barrie-secondary-suite-funding" element={<BarrieSecondarySuiteFunding />} />
          <Route path="barrie-basement-apartment-permits" element={<BarrieBasementApartmentPermits />} />
          <Route path="barrie-garden-suites" element={<BarrieGardenSuites />} />
          <Route path="barrie-aru-permit-rebate" element={<BarrieAruPermitRebate />} />
          <Route path="barrie-secondary-suite-costs" element={<BarrieSecondarySuiteCosts />} />
          <Route path="barrie-aru-eligibility" element={<BarrieAruEligibility />} />
          <Route path="st-catharines" element={<StCatharines />} />
          <Route path="st-catharines-adu-grant" element={<StCatharinesAduGrant />} />
          <Route path="st-catharines-adu-cost" element={<StCatharinesAduCost />} />
          <Route path="st-catharines-adu-permits" element={<StCatharinesAduPermits />} />
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
          <Route path="contractor-partners" element={<ContractorPartners />} />
          <Route path="hamilton-basement-grant" element={<HamiltonBasementGrantAd />}
          />
          </Route>
          </Routes>
        </Router>
      </PortalAuthProvider>
    </PortalDataProvider>
  );
}
