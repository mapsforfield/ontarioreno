import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Basements from './pages/Basements';
import LegalSuites from './pages/LegalSuites';
import Costs from './pages/Costs';
import Match from './pages/Match';
import CityToronto from './pages/CityToronto';
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
          <Route path="costs" element={<Costs />} />
          <Route path="match" element={<Match />} />
          <Route path="city/toronto" element={<CityToronto />} />
          <Route path="hamilton-grant-guide" element={<HamiltonGrant />} />
          <Route path="hamilton-basement-grant" element={<HamiltonBasementGrantAd />} />
        </Route>
      </Routes>
    </Router>
  );
}
