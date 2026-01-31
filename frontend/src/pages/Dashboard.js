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
  Euro
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Devis",
      value: stats?.total_quotes || 0,
      icon: FileText,
      color: "bg-blue-500",
      link: "/quotes"
    },
    {
      title: "Devis Envoyés",
      value: stats?.quotes_sent || 0,
      icon: Send,
      color: "bg-sky-500",
      link: "/quotes"
    },
    {
      title: "Devis Acceptés",
      value: stats?.quotes_accepted || 0,
      icon: CheckCircle,
      color: "bg-emerald-500",
      link: "/quotes"
    },
    {
      title: "Devis Refusés",
      value: stats?.quotes_refused || 0,
      icon: XCircle,
      color: "bg-red-500",
      link: "/quotes"
    },
    {
      title: "Chiffre d'Affaires",
      value: formatCurrency(stats?.total_revenue || 0),
      icon: Euro,
      color: "bg-emerald-600",
      isRevenue: true
    },
    {
      title: "Taux de Conversion",
      value: `${stats?.conversion_rate || 0}%`,
      icon: TrendingUp,
      color: "bg-violet-500"
    },
    {
      title: "Clients",
      value: stats?.total_clients || 0,
      icon: Users,
      color: "bg-amber-500",
      link: "/clients"
    },
    {
      title: "Prestations",
      value: stats?.total_services || 0,
      icon: Briefcase,
      color: "bg-indigo-500",
      link: "/services"
    },
  ];

  return (
    <div className="space-y-8 animate-slide-in" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            Tableau de bord
          </h1>
          <p className="text-slate-500 mt-1">Vue d'ensemble de votre activité</p>
        </div>
        <Link to="/quotes/new">
          <Button className="gap-2" data-testid="new-quote-btn">
            <Plus size={20} />
            Nouveau Devis
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => stat.link && window.location.assign(stat.link)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className={`text-2xl font-bold mt-2 ${stat.isRevenue ? 'font-mono text-emerald-600' : 'text-slate-900'}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="text-white" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Manrope' }}>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <Link to="/clients">
              <Button variant="outline" className="w-full h-20 flex-col gap-2" data-testid="quick-clients">
                <Users size={24} />
                <span>Gérer les clients</span>
              </Button>
            </Link>
            <Link to="/services">
              <Button variant="outline" className="w-full h-20 flex-col gap-2" data-testid="quick-services">
                <Briefcase size={24} />
                <span>Gérer les prestations</span>
              </Button>
            </Link>
            <Link to="/invoices">
              <Button variant="outline" className="w-full h-20 flex-col gap-2" data-testid="quick-invoices">
                <Receipt size={24} />
                <span>Voir les factures</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Manrope' }}>Résumé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Brouillons</span>
              <span className="font-semibold">{stats?.quotes_draft || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">En attente</span>
              <span className="font-semibold">{stats?.quotes_sent || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Factures émises</span>
              <span className="font-semibold">{stats?.total_invoices || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500">CA Total</span>
              <span className="font-semibold font-mono text-emerald-600">
                {formatCurrency(stats?.total_revenue || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
