import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { Header } from "@/components/header";
import NotFound from "@/pages/not-found";
import RecordsPage from "@/pages/records-page";
import RecommendationsPage from "@/pages/recommendations-page";
import SettingsPage from "@/pages/settings-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SettingsPage} />
      <Route path="/records" component={RecordsPage} />
      <Route path="/recommendations" component={RecommendationsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="meal-recommender-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <main>
              <Router />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
