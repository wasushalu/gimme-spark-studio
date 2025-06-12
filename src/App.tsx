
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPage from "@/pages/admin/AdminPage";
import AgentsPage from "@/pages/admin/AgentsPage";
import ModelsPage from "@/pages/admin/ModelsPage";
import ToolsPage from "@/pages/admin/ToolsPage";
import ApiKeysPage from "@/pages/admin/ApiKeysPage";
import LogsPage from "@/pages/admin/LogsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {navItems.map(({ to, page }) => (
            <Route key={to} path={to} element={page} />
          ))}
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="models" element={<ModelsPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="api-keys" element={<ApiKeysPage />} />
            <Route path="logs" element={<LogsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
