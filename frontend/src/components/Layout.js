import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Briefcase, 
  Receipt, 
  Settings, 
  LogOut,
  Menu,
  X,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

const navItems = [
  { path: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { path: "/quotes", label: "Devis", icon: FileText },
  { path: "/clients", label: "Clients", icon: Users },
  { path: "/services", label: "Prestations", icon: Briefcase },
  { path: "/invoices", label: "Factures", icon: Receipt },
  { path: "/settings", label: "Paramètres", icon: Settings },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[128px]"></div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          data-testid="mobile-menu-toggle"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <img 
          src="https://customer-assets.emergentagent.com/job_df4bb327-88bd-4623-9022-ebd45334706b/artifacts/7xmtrxds_Nvo%20logo%20Creativindustry%20France.png" 
          alt="CREATIVINDUSTRY" 
          className="h-8 object-contain"
        />
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-950/80 backdrop-blur-2xl border-r border-white/5 z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-center px-4 border-b border-white/10">
            <img 
              src="https://customer-assets.emergentagent.com/job_df4bb327-88bd-4623-9022-ebd45334706b/artifacts/7xmtrxds_Nvo%20logo%20Creativindustry%20France.png" 
              alt="CREATIVINDUSTRY France" 
              className="h-14 object-contain"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`
                }
                data-testid={`nav-${item.path.replace("/", "")}`}
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-sm font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white rounded-xl"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut size={18} />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 relative z-10">
        <div className="p-6 md:p-8 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
