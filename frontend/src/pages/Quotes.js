import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getQuotes, deleteQuote, sendQuote, getQuotePdf, updateQuote, convertQuoteToInvoice } from "../lib/api";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Badge } from "../components/ui/badge";
import { 
  Plus, 
  MoreVertical, 
  Eye, 
  Send, 
  Download, 
  Trash2, 
  FileText,
  CheckCircle,
  XCircle,
  Receipt,
  Mail,
  MailOpen
} from "lucide-react";

const Quotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const response = await getQuotes();
      setQuotes(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des devis");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) return;
    try {
      await deleteQuote(id);
      toast.success("Devis supprimé");
      loadQuotes();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSend = async (id) => {
    try {
      await sendQuote(id);
      toast.success("Devis envoyé par email");
      loadQuotes();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'envoi");
    }
  };

  const handleDownloadPdf = async (id, clientName, quoteNumber) => {
    try {
      const response = await getQuotePdf(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Devis-${clientName}-${quoteNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF téléchargé");
    } catch (error) {
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateQuote(id, { status });
      toast.success("Statut mis à jour");
      loadQuotes();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleConvertToInvoice = async (id) => {
    try {
      await convertQuoteToInvoice(id);
      toast.success("Devis converti en facture");
      loadQuotes();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la conversion");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      brouillon: { label: "Brouillon", className: "bg-slate-100 text-slate-800" },
      envoyé: { label: "Envoyé", className: "bg-blue-100 text-blue-800" },
      accepté: { label: "Accepté", className: "bg-emerald-100 text-emerald-800" },
      refusé: { label: "Refusé", className: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[status] || statusConfig.brouillon;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in" data-testid="quotes-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            Devis
          </h1>
          <p className="text-slate-500 mt-1">{quotes.length} devis au total</p>
        </div>
        <Link to="/quotes/new">
          <Button className="gap-2" data-testid="new-quote-btn">
            <Plus size={20} />
            Nouveau Devis
          </Button>
        </Link>
      </div>

      {/* Quotes Table */}
      <Card>
        <CardContent className="p-0">
          {quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="text-slate-300 mb-4" size={64} />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun devis</h3>
              <p className="text-slate-500 mb-4">Créez votre premier devis pour commencer</p>
              <Link to="/quotes/new">
                <Button data-testid="empty-new-quote-btn">
                  <Plus size={20} className="mr-2" />
                  Créer un devis
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">N° Devis</TableHead>
                  <TableHead className="font-semibold">Client</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Montant TTC</TableHead>
                  <TableHead className="font-semibold">Statut</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium font-mono">{quote.quote_number}</TableCell>
                    <TableCell>{quote.client_name}</TableCell>
                    <TableCell>{formatDate(quote.emission_date)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(quote.total_ttc)}</TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`quote-actions-${quote.id}`}>
                            <MoreVertical size={20} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => navigate(`/quotes/${quote.id}`)}>
                            <Eye size={16} className="mr-2" /> Voir / Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPdf(quote.id, quote.client_name, quote.quote_number)}>
                            <Download size={16} className="mr-2" /> Télécharger PDF
                          </DropdownMenuItem>
                          {quote.status === 'brouillon' && (
                            <DropdownMenuItem onClick={() => handleSend(quote.id)}>
                              <Send size={16} className="mr-2" /> Envoyer par email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'accepté')}>
                            <CheckCircle size={16} className="mr-2 text-emerald-600" /> Marquer accepté
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'refusé')}>
                            <XCircle size={16} className="mr-2 text-red-600" /> Marquer refusé
                          </DropdownMenuItem>
                          {quote.status === 'accepté' && (
                            <DropdownMenuItem onClick={() => handleConvertToInvoice(quote.id)}>
                              <Receipt size={16} className="mr-2 text-blue-600" /> Convertir en facture
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(quote.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 size={16} className="mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Quotes;
