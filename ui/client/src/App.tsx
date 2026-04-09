import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import Workflows from "./pages/Workflows";
import RunPage from "./pages/RunPage";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/not-found";

function AppShell() {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-auto">
          <Router hook={useHashLocation}>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/agents" component={Agents} />
              <Route path="/workflows" component={Workflows} />
              <Route path="/run/:type/:name" component={RunPage} />
              <Route path="/reports" component={Reports} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </Router>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
      <Toaster />
    </QueryClientProvider>
  );
}
