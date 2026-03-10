import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import InboxPage from "./pages/InboxPage";
import TodayPage from "./pages/TodayPage";
import Next10DaysPage from "./pages/Next10DaysPage";
import SomedayPage from "./pages/SomedayPage";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/inbox"} component={InboxPage} />
      <Route path={"/today"} component={TodayPage} />
      <Route path={"/next10days"} component={Next10DaysPage} />
      <Route path={"/someday"} component={SomedayPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
