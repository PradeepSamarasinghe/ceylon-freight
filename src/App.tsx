import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import PostLoad from "./pages/PostLoad";
import FindTrucks from "./pages/FindTrucks";
import LiveTracking from "./pages/LiveTracking";
import MarketRates from "./pages/MarketRates";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import DriverDashboard from "./pages/DriverDashboard";
import Onboarding from "./pages/Onboarding";
import ProfileSettings from "./pages/ProfileSettings";
import Notifications from "./pages/Notifications";
import ShipmentDetails from "./pages/ShipmentDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/driver-dashboard" element={<DriverDashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/profile" element={<ProfileSettings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/shipment/:id" element={<ShipmentDetails />} />
            <Route path="/post-load" element={<PostLoad />} />
            <Route path="/find-trucks" element={<FindTrucks />} />
            <Route path="/tracking" element={<LiveTracking />} />
            <Route path="/market-rates" element={<MarketRates />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
