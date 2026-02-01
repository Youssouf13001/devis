import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getQuotes, deleteQuote, sendQuote, getQuotePdf, updateQuote, convertQuoteToInvoice, getEmailPreview } from "../lib/api";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
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
  MailOpen,
  RefreshCw
} from "lucide-react";

const Quotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailData, setEmailData] = useState(null);
  const [emailMessage, setEmailMessage] = useState("");
  const [sending, setSending] = useState(false);
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

  const openEmailModal = async (quoteId) => {
    try {
      const response = await getEmailPreview(quoteId);
      setEmailData({ ...response.data, quoteId });
      setEmailMessage(response.data.default_message);
      setEmailModalOpen(true);
    } catch (error) {
      toast.error("Erreur lors de la préparation de l'email");
    }
  };

  const handleSendEmail = async () => {
    if (!emailData) return;
    setSending(true);
    try {
      await sendQuote(emailData.quoteId, emailMessage);
      toast.success("Devis envoyé avec succès !");
      setEmailModalOpen(false);
      loadQuotes();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
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

  const getReadStatus = (quote) => {
    if (!quote.sent_at) return null;
    
    if (quote.opened_at) {
      const openDate = new Date(quote.opened_at).toLocaleDateString('fr-FR');
      const openTime = new Date(quote.opened_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return (
        <div className="flex items-center gap-1 text-emerald-600" title={`Ouvert ${quote.open_count || 1} fois - Dernière lecture: ${openDate} à ${openTime}`}>
          <MailOpen size={16} />
          <span className="text-xs">Lu ({quote.open_count || 1}x)</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1 text-slate-400" title="Pas encore ouvert">
        <Mail size={16} />
        <span className="text-xs">Non lu</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in" data-testid="quotes-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Manrope' }}>
            Devis
          </h1>
          <p className="text-slate-400 mt-1">{quotes.length} devis au total</p>
        </div>
        <Link to="/quotes/new">
          <Button className="gap-2 btn-glow rounded-xl" data-testid="new-quote-btn">
            <Plus size={20} />
            Nouveau Devis
          </Button>
        </Link>
      </div>

      {/* Quotes Table */}
      <Card className="glass-card border-white/10 overflow-hidden">
        <CardContent className="p-0">
          {quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="text-slate-500 mb-4" size={64} />
              <h3 className="text-lg font-medium text-white mb-2">Aucun devis</h3>
              <p className="text-slate-400 mb-4">Créez votre premier devis pour commencer</p>
              <Link to="/quotes/new">
                <Button className="btn-glow rounded-xl" data-testid="empty-new-quote-btn">
                  <Plus size={20} className="mr-2" />
                  Créer un devis
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-900/50 border-b border-white/10">
                  <TableHead className="font-semibold text-slate-300">N° Devis</TableHead>
                  <TableHead className="font-semibold text-slate-300">Client</TableHead>
                  <TableHead className="font-semibold text-slate-300">Date</TableHead>
                  <TableHead className="font-semibold text-slate-300">Montant TTC</TableHead>
                  <TableHead className="font-semibold text-slate-300">Statut</TableHead>
                  <TableHead className="font-semibold text-slate-300">Lecture</TableHead>
                  <TableHead className="text-right font-semibold text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id} className="hover:bg-white/5 border-b border-white/5">
                    <TableCell className="font-medium font-mono text-amber-400">{quote.quote_number}</TableCell>
                    <TableCell className="text-white">{quote.client_name}</TableCell>
                    <TableCell className="text-slate-300">{formatDate(quote.emission_date)}</TableCell>
                    <TableCell className="font-mono text-emerald-400">{formatCurrency(quote.total_ttc)}</TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell>{getReadStatus(quote)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10" data-testid={`quote-actions-${quote.id}`}>
                            <MoreVertical size={20} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-white/10">
                          <DropdownMenuItem onClick={() => navigate(`/quotes/${quote.id}`)} className="text-slate-300 hover:text-white hover:bg-white/10">
                            <Eye size={16} className="mr-2" /> Voir / Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPdf(quote.id, quote.client_name, quote.quote_number)} className="text-slate-300 hover:text-white hover:bg-white/10">
                            <Download size={16} className="mr-2" /> Télécharger PDF
                          </DropdownMenuItem>
                          {quote.status === 'brouillon' && (
                            <DropdownMenuItem onClick={() => handleSend(quote.id)} className="text-slate-300 hover:text-white hover:bg-white/10">
                              <Send size={16} className="mr-2" /> Envoyer par email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'accepté')} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                            <CheckCircle size={16} className="mr-2" /> Marquer accepté
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'refusé')} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            <XCircle size={16} className="mr-2" /> Marquer refusé
                          </DropdownMenuItem>
                          {quote.status === 'accepté' && (
                            <DropdownMenuItem onClick={() => handleConvertToInvoice(quote.id)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                              <Receipt size={16} className="mr-2" /> Convertir en facture
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(quote.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
