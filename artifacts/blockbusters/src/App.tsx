import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import { MatchSelector } from "@/pages/MatchSelector";
import HostView from "@/pages/HostView";
import AudienceView from "@/pages/AudienceView";
import ModeratorView from "@/pages/ModeratorView";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      
      {/* Role selection paths */}
      <Route path="/host" component={() => <MatchSelector role="host" />} />
      <Route path="/audience" component={() => <MatchSelector role="audience" />} />
      <Route path="/moderator" component={() => <MatchSelector role="moderator" />} />

      {/* Actual active views */}
      <Route path="/host/:id" component={HostView} />
      <Route path="/audience/:id" component={AudienceView} />
      <Route path="/moderator/:id" component={ModeratorView} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
