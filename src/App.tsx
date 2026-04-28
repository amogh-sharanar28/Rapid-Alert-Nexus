import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SimulationProvider } from "@/context/SimulationContext";
import TopNav from "@/components/TopNav";
import HomePage from "./pages/HomePage";
import DataInputPage from "./pages/DataInputPage";
import ProcessingPage from "./pages/ProcessingPage";
import DashboardPage from "./pages/DashboardPage";
import ResponseConsolePage from "./pages/ResponseConsolePage";
import DispatchHistoryPage from "./pages/DispatchHistoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SimulationProvider>
          <div className="dark">
            <TopNav />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/data-input" element={<DataInputPage />} />
              <Route path="/processing" element={<ProcessingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/response" element={<ResponseConsolePage />} />
              <Route path="/history" element={<DispatchHistoryPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </SimulationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
