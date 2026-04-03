import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Basements from './pages/Basements';
import LegalSuites from './pages/LegalSuites';
import KitchenRenovations from './pages/KitchenRenovations';
import BathroomRenovations from './pages/BathroomRenovations';
import Costs from './pages/Costs';
import Match from './pages/Match';
import HamiltonGrant from './pages/HamiltonGrant';
import HamiltonBasementGrantAd from './pages/HamiltonBasementGrantAd';

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
          <Route path="hamilton-grant-guide" element={<HamiltonGrant />} />
          <Route
            path="hamilton-basement-grant"
            element={<HamiltonBasementGrantAd />}
          />
        </Route>
      </Routes>
    </Router>
  );
}