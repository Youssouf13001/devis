import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  FileText, 
  Users, 
  Briefcase, 
  Receipt, 
  TrendingUp, 
  Send, 
  CheckCircle, 
  XCircle,
  Plus,
  Euro,
  Sparkles,
  ArrowUpRight
} from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-in" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Manrope' }}>
            <Sparkles className="text-amber-500" size={32} />
            Tableau de bord
          </h1>
          <p className="text-slate-400 mt-1">Vue d'ensemble de votre activité</p>
        </div>
        <Link to="/quotes/new">
          <Button className="gap-2 btn-glow rounded-xl" data-testid="new-quote-btn">
            <Plus size={20} />
            Nouveau Devis
          </Button>
        </Link>
      </div>

      {/* Main Stats - Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chiffre d'Affaires - Large Card */}
        <div className="lg:col-span-2 glass-card p-6 stat-card stat-amber glow-amber overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Chiffre d'Affaires</p>
              <p className="text-4xl font-bold mt-2 text-white font-mono">
                {formatCurrency(stats?.total_revenue || 0)}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-emerald-400 text-sm flex items-center gap-1">
                  <TrendingUp size={16} />
                  Taux: {stats?.conversion_rate || 0}%
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl shadow-lg shadow-amber-500/20">
              <Euro className="text-white" size={32} />
            </div>
          </div>
        </div>

        {/* Total Devis */}
        <Link to="/quotes" className="glass-card p-6 stat-card stat-violet hover:scale-[1.02] transition-transform">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Devis</p>
              <p className="text-3xl font-bold mt-2 text-white">{stats?.total_quotes || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-3 rounded-xl">
              <FileText className="text-white" size={24} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-violet-400 text-sm">
            <ArrowUpRight size={14} />
            Voir tous
          </div>
        </Link>

        {/* Clients */}
        <Link to="/clients" className="glass-card p-6 stat-card stat-cyan hover:scale-[1.02] transition-transform">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Clients</p>
              <p className="text-3xl font-bold mt-2 text-white">{stats?.total_clients || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500 to-teal-600 p-3 rounded-xl">
              <Users className="text-white" size={24} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-cyan-400 text-sm">
            <ArrowUpRight size={14} />
            Gérer
          </div>
        </Link>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 stat-card stat-lime">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Acceptés</p>
              <p className="text-2xl font-bold mt-1 text-emerald-400">{stats?.quotes_accepted || 0}</p>
            </div>
            <CheckCircle className="text-emerald-500" size={28} />
          </div>
        </div>

        <div className="glass-card p-5 stat-card stat-amber">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Envoyés</p>
              <p className="text-2xl font-bold mt-1 text-amber-400">{stats?.quotes_sent || 0}</p>
            </div>
            <Send className="text-amber-500" size={28} />
          </div>
        </div>

        <div className="glass-card p-5 stat-card stat-pink">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Refusés</p>
              <p className="text-2xl font-bold mt-1 text-red-400">{stats?.quotes_refused || 0}</p>
            </div>
            <XCircle className="text-red-500" size={28} />
          </div>
        </div>

        <Link to="/services" className="glass-card p-5 stat-card stat-violet hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Prestations</p>
              <p className="text-2xl font-bold mt-1 text-violet-400">{stats?.total_services || 0}</p>
            </div>
            <Briefcase className="text-violet-500" size={28} />
          </div>
        </Link>
      </div>

      {/* Quick Actions & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Manrope' }}>
            Actions Rapides
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <Link to="/quotes/new">
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 hover:border-amber-500/50 hover:scale-[1.02] transition-all text-center">
                <Plus className="mx-auto text-amber-500 mb-2" size={28} />
                <span className="text-sm text-slate-300">Créer un devis</span>
              </div>
            </Link>
            <Link to="/clients">
              <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/30 rounded-xl p-4 hover:border-cyan-500/50 hover:scale-[1.02] transition-all text-center">
                <Users className="mx-auto text-cyan-500 mb-2" size={28} />
                <span className="text-sm text-slate-300">Clients</span>
              </div>
            </Link>
            <Link to="/invoices">
              <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 rounded-xl p-4 hover:border-violet-500/50 hover:scale-[1.02] transition-all text-center">
                <Receipt className="mx-auto text-violet-500 mb-2" size={28} />
                <span className="text-sm text-slate-300">Factures</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Manrope' }}>
            Résumé
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-slate-400">Brouillons</span>
              <span className="font-semibold text-white">{stats?.quotes_draft || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-slate-400">En attente</span>
              <span className="font-semibold text-amber-400">{stats?.quotes_sent || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-slate-400">Factures émises</span>
              <span className="font-semibold text-white">{stats?.total_invoices || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400">CA Total</span>
              <span className="font-bold font-mono text-emerald-400">
                {formatCurrency(stats?.total_revenue || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
