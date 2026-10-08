import { Routes, Route } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Landing from "@/pages/Landing";
import Overview from "@/pages/Overview";
import Explorer from "@/pages/Explorer";
import CustomerDetail from "@/pages/CustomerDetail";
import RiskAnalysis from "@/pages/RiskAnalysis";
import Retention from "@/pages/Retention";
import ModelIntelligence from "@/pages/ModelIntelligence";
import About from "@/pages/About";
import ComingSoon from "@/components/ComingSoon";
import { DatasetProvider } from "@/lib/DatasetContext";

export default function App() {
  return (
    <DatasetProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<AppLayout />}>
          <Route path="/overview" element={<Overview />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/customer/:id" element={<CustomerDetail />} />
          <Route path="/risk" element={<RiskAnalysis />} />
          <Route path="/retention" element={<Retention />} />
          <Route path="/model-intelligence" element={<ModelIntelligence />} />
          <Route path="/about" element={<About />} />
          <Route
            path="*"
            element={<ComingSoon title="Page not found" note="Use the navigation above to find what you're looking for." />}
          />
        </Route>
      </Routes>
    </DatasetProvider>
  );
}
