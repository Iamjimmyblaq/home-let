import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Listings from "./pages/Listings";
import PropertyDetail from "./pages/PropertyDetail";
import Hotels from "./pages/Hotels";
import { Agents, AgentProfile } from "./pages/Agents";
import VirtualTour from "./pages/VirtualTour";
import Contact from "./pages/Contact";
import { Login, Register } from "./pages/Auth";
import Wallet from "./pages/Wallet";
import Inspection from "./pages/Inspection";
import Chat from "./pages/Chat";
import Booking from "./pages/Booking";
import UserDashboard from "./pages/UserDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agent-profile/:id" element={<AgentProfile />} />
          <Route path="/tour/:id" element={<VirtualTour />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/inspection/:id" element={<Inspection />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/booking/:id" element={<Booking />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/agent" element={<AgentDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
