import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Quotes from "./pages/Quotes";
import QuoteEditor from "./pages/QuoteEditor";
import Clients from "./pages/Clients";
import Services from "./pages/Services";
import Invoices from "./pages/Invoices";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
import { FileText } from "lucide-react";

const CustomBadge = () => (
  <div
    id="creativindustry-badge"
    style={{
      display: 'inline-flex',
      boxSizing: 'border-box',
      width: '190px',
      height: '40px',
      padding: '8px 12px',
      alignItems: 'center',
      gap: '8px',
      borderRadius: '50px',
      background: '#d97706',
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      textDecoration: 'none',
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      fontWeight: '600',
      color: 'white',
      zIndex: 9999,
    }}
  >
    <FileText size={16} />
    <span>Application interne v1</span>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <CustomBadge />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="quotes/new" element={<QuoteEditor />} />
            <Route path="quotes/:id" element={<QuoteEditor />} />
            <Route path="clients" element={<Clients />} />
            <Route path="services" element={<Services />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
