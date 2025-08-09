import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useAuth } from './contexts/AuthContext';
import { ChangePasswordForm } from './components/ChangePasswordForm';

const queryClient = new QueryClient();

function App() {
  const { user } = useAuth();

  // Add debugging
  console.log('App - Current user:', user);
  console.log('App - force_password_change:', user?.force_password_change);

  // Show password change form if user needs to change password
  if (user?.force_password_change) {
    console.log('App - Showing password change form');
    return <ChangePasswordForm />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
