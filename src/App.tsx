
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ChatPage from "./pages/ChatPage";
import AdminPage from "./pages/admin/AdminPage";
import AdminLayout from "./components/admin/AdminLayout";
import AgentsPage from "./pages/admin/AgentsPage";
import ModelsPage from "./pages/admin/ModelsPage";
import ToolsPage from "./pages/admin/ToolsPage";
import LogsPage from "./pages/admin/LogsPage";

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
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="agents" element={<AgentsPage />} />
              <Route path="models" element={<ModelsPage />} />
              <Route path="tools" element={<ToolsPage />} />
              <Route path="logs" element={<LogsPage />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
