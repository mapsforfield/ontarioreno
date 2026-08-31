import { lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LazyRoutes } from './components/RouteChunkBoundary';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
const Home = lazy(() => import('./pages/Home'));
const GrantsHub = lazy(() => import('./pages/GrantsHub'));
const GrantLandingPage = lazy(() => import('./pages/GrantLandingPage'));
const Basements = lazy(() => import('./pages/Basements'));
const LegalSuites = lazy(() => import('./pages/LegalSuites'));
const GardenSuitesLanewaySuitesOntario = lazy(() => import('./pages/GardenSuitesLanewaySuitesOntario'));
const GardenSuiteCostOntario = lazy(() => import('./pages/GardenSuiteCostOntario'));
const GardenSuitePermitsOntario = lazy(() => import('./pages/GardenSuitePermitsOntario'));
const LanewaySuiteCostOntario = lazy(() => import('./pages/LanewaySuiteCostOntario'));
const LanewaySuitePermitsOntario = lazy(() => import('./pages/LanewaySuitePermitsOntario'));
const KitchenRenovations = lazy(() => import('./pages/KitchenRenovations'));
const BathroomRenovations = lazy(() => import('./pages/BathroomRenovations'));
const Costs = lazy(() => import('./pages/Costs'));
const Match = lazy(() => import('./pages/Match'));
const Cities = lazy(() => import('./pages/Cities'));
const Financing = lazy(() => import('./pages/Financing'));
const HomeEquityRenovationsOntario = lazy(() => import('./pages/HomeEquityRenovationsOntario'));
const HelocVsRefinanceForRenovations = lazy(() => import('./pages/HelocVsRefinanceForRenovations'));
const HelocForLegalBasementApartment = lazy(() => import('./pages/HelocForLegalBasementApartment'));
const GardenSuiteFinancingOntario = lazy(() => import('./pages/GardenSuiteFinancingOntario'));
const HelocVsRenovationFinancing = lazy(() => import('./pages/HelocVsRenovationFinancing'));
const PhasedRenovationFinancing = lazy(() => import('./pages/PhasedRenovationFinancing'));
const GrantsAndIncentivesWithHomeEquity = lazy(() => import('./pages/GrantsAndIncentivesWithHomeEquity'));
const OpenLoanFinancing = lazy(() => import('./pages/OpenLoanFinancing'));
const GrantEligibilityCalculator = lazy(() => import('./pages/GrantEligibilityCalculator'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const HamiltonGrant = lazy(() => import('./pages/HamiltonGrant'));
const HamiltonBasementGrantAd = lazy(() => import('./pages/HamiltonBasementGrantAd'));
const HamiltonSecondarySuiteGrant = lazy(() => import('./pages/HamiltonSecondarySuiteGrant'));
const HamiltonPermitTimeline = lazy(() => import('./pages/HamiltonPermitTimeline'));
const HamiltonBasementPermitNeed = lazy(() => import('./pages/HamiltonBasementPermitNeed'));
const OntarioLegalBasementRequirements = lazy(() => import('./pages/OntarioLegalBasementRequirements'));
const HamiltonPermitDelayAvoidance = lazy(() => import('./pages/HamiltonPermitDelayAvoidance'));
const HamiltonBasementRenovationCost = lazy(() => import('./pages/HamiltonBasementRenovationCost'));
const MiltonBasementRenovation = lazy(() => import('./pages/MiltonBasementRenovation'));
const MiltonBasementRenovationCost = lazy(() => import('./pages/MiltonBasementRenovationCost'));
const MiltonLegalBasement = lazy(() => import('./pages/MiltonLegalBasement'));
const MiltonBasementPermit = lazy(() => import('./pages/MiltonBasementPermit'));
const BurlingtonBasementRenovation = lazy(() => import('./pages/BurlingtonBasementRenovation'));
const BarrieBasementRenovation = lazy(() => import('./pages/BarrieBasementRenovation'));
const BurlingtonBasementRenovationCost = lazy(() => import('./pages/BurlingtonBasementRenovationCost'));
const BurlingtonLegalBasement = lazy(() => import('./pages/BurlingtonLegalBasement'));
const BurlingtonBasementPermit = lazy(() => import('./pages/BurlingtonBasementPermit'));
const BurlingtonAruIncentiveProgram = lazy(() => import('./pages/BurlingtonAruIncentiveProgram'));
const BarrieSecondarySuiteFunding = lazy(() => import('./pages/BarrieSecondarySuiteFunding'));
const BarrieBasementApartmentPermits = lazy(() => import('./pages/BarrieBasementApartmentPermits'));
const BarrieGardenSuites = lazy(() => import('./pages/BarrieGardenSuites'));
const BarrieAruPermitRebate = lazy(() => import('./pages/BarrieAruPermitRebate'));
const BarrieSecondarySuiteCosts = lazy(() => import('./pages/BarrieSecondarySuiteCosts'));
const BarrieAruEligibility = lazy(() => import('./pages/BarrieAruEligibility'));
const StCatharines = lazy(() => import('./pages/StCatharines'));
const StCatharinesAduGrant = lazy(() => import('./pages/StCatharinesAduGrant'));
const StCatharinesAduCost = lazy(() => import('./pages/StCatharinesAduCost'));
const StCatharinesAduPermits = lazy(() => import('./pages/StCatharinesAduPermits'));
const MississaugaBasementRenovation = lazy(() => import('./pages/MississaugaBasementRenovation'));
const MississaugaBasementRenovationCost = lazy(() => import('./pages/MississaugaBasementRenovationCost'));
const MississaugaLegalBasement = lazy(() => import('./pages/MississaugaLegalBasement'));
const MississaugaBasementPermit = lazy(() => import('./pages/MississaugaBasementPermit'));
const BramptonBasementRenovation = lazy(() => import('./pages/BramptonBasementRenovation'));
const BramptonBasementRenovationCost = lazy(() => import('./pages/BramptonBasementRenovationCost'));
const BramptonLegalBasement = lazy(() => import('./pages/BramptonLegalBasement'));
const BramptonBasementPermit = lazy(() => import('./pages/BramptonBasementPermit'));
const AjaxBasementRenovation = lazy(() => import('./pages/AjaxBasementRenovation'));
const AjaxBasementRenovationCost = lazy(() => import('./pages/AjaxBasementRenovationCost'));
const AjaxLegalBasement = lazy(() => import('./pages/AjaxLegalBasement'));
const AjaxBasementPermit = lazy(() => import('./pages/AjaxBasementPermit'));
const PickeringBasementRenovation = lazy(() => import('./pages/PickeringBasementRenovation'));
const PickeringBasementRenovationCost = lazy(() => import('./pages/PickeringBasementRenovationCost'));
const PickeringLegalBasement = lazy(() => import('./pages/PickeringLegalBasement'));
const PickeringBasementPermit = lazy(() => import('./pages/PickeringBasementPermit'));
const WhitbyBasementRenovation = lazy(() => import('./pages/WhitbyBasementRenovation'));
const WhitbyBasementRenovationCost = lazy(() => import('./pages/WhitbyBasementRenovationCost'));
const WhitbyLegalBasement = lazy(() => import('./pages/WhitbyLegalBasement'));
const WhitbyBasementPermit = lazy(() => import('./pages/WhitbyBasementPermit'));
const OshawaBasementRenovation = lazy(() => import('./pages/OshawaBasementRenovation'));
const OshawaBasementRenovationCost = lazy(() => import('./pages/OshawaBasementRenovationCost'));
const OshawaLegalBasement = lazy(() => import('./pages/OshawaLegalBasement'));
const OshawaBasementPermit = lazy(() => import('./pages/OshawaBasementPermit'));
const ContractorPartners = lazy(() => import('./pages/ContractorPartners'));
// ─── Portal ───────────────────────────────────────────────────────────────
// Split out of the entry bundle, like the marketing pages above.
//
// These were static imports, so all twenty of them — the 5,000-line
// consultations calendar, the deals board, the contract PDF and DOCX writers —
// were compiled into the one file every visitor downloads. A homeowner landing
// on a grant page from an ad was parsing the whole broker portal before they
// saw anything. Nothing here is reachable without logging in, so none of it
// belongs on that path.
//
// The providers below stay static: they wrap the router itself rather than
// answering to a route, and PortalGuard has to be able to decide before
// anything loads. LazyRoutes already wraps every route in this file, so the
// chunk-failure fallback covers these too.
import { PortalAuthProvider } from './portal/auth';
import { PortalGuard } from './portal/components/PortalGuard';
import { PortalDataProvider } from './portal/data/store';
const PortalLayout = lazy(() => import('./portal/components/PortalLayout'));
const PortalAdmin = lazy(() => import('./portal/pages/PortalAdmin'));
const PortalGrants = lazy(() => import('./portal/pages/PortalGrants'));
const PortalAppointments = lazy(() => import('./portal/pages/PortalAppointments'));
const PortalAnalytics = lazy(() => import('./portal/pages/PortalAnalytics'));
const PortalContractors = lazy(() => import('./portal/pages/PortalContractors'));
const PortalDashboard = lazy(() => import('./portal/pages/PortalDashboard'));
const PortalContracts = lazy(() => import('./portal/pages/PortalContracts'));
const PortalDeals = lazy(() => import('./portal/pages/PortalDeals'));
const PortalWorkspace = lazy(() => import('./portal/pages/PortalWorkspace'));
const ContractorCalendar = lazy(() => import('./portal/pages/ContractorCalendar'));
const ContractorClients = lazy(() => import('./portal/pages/ContractorClients'));
const PortalFinancing = lazy(() => import('./portal/pages/PortalFinancing'));
const PortalClients = lazy(() => import('./portal/pages/PortalClients'));
const PortalSubmissions = lazy(() => import('./portal/pages/PortalSubmissions'));
const PortalConversations = lazy(() => import('./portal/pages/PortalConversations'));
const PortalInvoices = lazy(() => import('./portal/pages/PortalInvoices'));
const PortalTasks = lazy(() => import('./portal/pages/PortalTasks'));
const PortalLogin = lazy(() => import('./portal/pages/PortalLogin'));
const ConsultationReschedule = lazy(() => import('./portal/pages/ConsultationReschedule'));
const ConsultationCancel = lazy(() => import('./portal/pages/ConsultationCancel'));
const ConsultationFlow = lazy(() => import('./pages/ConsultationFlow'));

export default function App() {
  return (
    <PortalAuthProvider>
      <PortalDataProvider>
        <Router>
          <ScrollToTop />
          <LazyRoutes>
          <Routes>
          {/* Public homeowner qualification + booking flow. Standalone (outside
              the marketing Layout) so the journey stays focused, and entirely
              unauthenticated — a homeowner never sees the portal. */}
          <Route path="/consultation/:slug" element={<ConsultationFlow />} />

          {/* Public customer-facing consultation pages — no auth required */}
          <Route
            path="/portal/consultation/:id/reschedule"
            element={<ConsultationReschedule />}
          />
          <Route
            path="/portal/consultation/:id/cancel"
            element={<ConsultationCancel />}
          />

          <Route path="/portal/login" element={<PortalLogin />} />
          <Route element={<PortalGuard />}>
            <Route path="/portal" element={<PortalLayout />}>
              <Route index element={<PortalDashboard />} />
              <Route path="dashboard" element={<PortalDashboard />} />
              <Route path="cx-calendar" element={<ContractorCalendar />} />
              <Route path="cx-clients" element={<ContractorClients />} />
              <Route path="workspace" element={<PortalWorkspace />} />
              <Route path="contractors" element={<PortalContractors />} />
              <Route path="deals" element={<PortalDeals />} />
              <Route path="contracts" element={<PortalContracts />} />
              <Route path="appointments" element={<PortalAppointments />} />
              <Route path="clients" element={<PortalClients />} />
              <Route path="tasks" element={<PortalTasks />} />
              <Route path="financing" element={<PortalFinancing />} />
              {/* Analytics hub — all four render the tabbed PortalAnalytics so
                  existing deep links keep working. */}
              <Route path="sales-tracker" element={<PortalAnalytics />} />
              <Route path="performance" element={<PortalAnalytics />} />
              <Route path="leaderboard" element={<PortalAnalytics />} />
              <Route path="commissions" element={<PortalAnalytics />} />
              <Route element={<PortalGuard adminOnly />}>
                <Route path="admin" element={<PortalAdmin />} />
                <Route path="grants" element={<PortalGrants />} />
                <Route path="submissions" element={<PortalSubmissions />} />
                <Route path="conversations" element={<PortalConversations />} />
                <Route path="invoices" element={<PortalInvoices />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="basements" element={<Basements />} />
          <Route path="grants" element={<GrantsHub />} />
          <Route path="grants/:slug" element={<GrantLandingPage />} />
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
          </LazyRoutes>
        </Router>
      </PortalDataProvider>
    </PortalAuthProvider>
  );
}
