import { useState, useEffect } from "react";
import { getInvoices, updateInvoiceStatus, addPaymentToInvoice, deletePayment, getInvoicePdf } from "../lib/api";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { MoreVertical, Receipt, CheckCircle, XCircle, Clock, Plus, Trash2, CreditCard, Download, Eye } from "lucide-react";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: "virement",
    notes: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await getInvoices();
      setInvoices(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des factures");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateInvoiceStatus(id, status);
      toast.success("Statut mis à jour");
      loadInvoices();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const openPaymentDialog = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amount: "",
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: "virement",
      notes: ""
    });
    setPaymentDialogOpen(true);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }
    setSaving(true);
    try {
      await addPaymentToInvoice(selectedInvoice.id, {
        ...paymentForm,
        amount: parseFloat(paymentForm.amount)
      });
      toast.success("Acompte ajouté");
      setPaymentDialogOpen(false);
      loadInvoices();
    } catch (error) {
      toast.error("Erreur lors de l'ajout de l'acompte");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async (invoiceId, paymentId) => {
    if (!window.confirm("Supprimer ce paiement ?")) return;
    try {
      await deletePayment(invoiceId, paymentId);
      toast.success("Paiement supprimé");
      loadInvoices();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      "en attente": { label: "En attente", className: "bg-amber-100 text-amber-800" },
      "partiellement payée": { label: "Acompte reçu", className: "bg-blue-100 text-blue-800" },
      "payée": { label: "Payée", className: "bg-emerald-100 text-emerald-800" },
      "annulée": { label: "Annulée", className: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[status] || statusConfig["en attente"];
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
    <div className="space-y-6 animate-slide-in" data-testid="invoices-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            Factures
          </h1>
          <p className="text-slate-500 mt-1">{invoices.length} factures au total</p>
        </div>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Receipt className="text-slate-300 mb-4" size={64} />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune facture</h3>
              <p className="text-slate-500">Les factures apparaîtront ici lorsque vous convertirez des devis acceptés</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">N° Facture</TableHead>
                  <TableHead className="font-semibold">Client</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Total TTC</TableHead>
                  <TableHead className="font-semibold">Acompte</TableHead>
                  <TableHead className="font-semibold">Reste à payer</TableHead>
                  <TableHead className="font-semibold">Statut</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium font-mono">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.client_name}</TableCell>
                    <TableCell>{formatDate(invoice.emission_date)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(invoice.total_ttc)}</TableCell>
                    <TableCell className="font-mono text-emerald-600">{formatCurrency(invoice.acompte)}</TableCell>
                    <TableCell className="font-mono text-amber-600 font-semibold">{formatCurrency(invoice.reste_a_payer)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`invoice-actions-${invoice.id}`}>
                            <MoreVertical size={20} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => openPaymentDialog(invoice)}>
                            <CreditCard size={16} className="mr-2 text-emerald-600" /> Ajouter un acompte
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'payée')}>
                            <CheckCircle size={16} className="mr-2 text-emerald-600" /> Marquer payée
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'en attente')}>
                            <Clock size={16} className="mr-2 text-amber-600" /> Marquer en attente
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'annulée')}>
                            <XCircle size={16} className="mr-2 text-red-600" /> Marquer annulée
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

      {/* Payments detail for each invoice */}
      {invoices.filter(inv => inv.payments && inv.payments.length > 0).map((invoice) => (
        <Card key={invoice.id} className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Paiements - {invoice.invoice_number} ({invoice.client_name})</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell className="font-mono text-emerald-600">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="capitalize">{payment.payment_method}</TableCell>
                    <TableCell>{payment.notes || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePayment(invoice.id, payment.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope' }}>
              Ajouter un acompte
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm">
              <p><strong>Facture:</strong> {selectedInvoice.invoice_number}</p>
              <p><strong>Client:</strong> {selectedInvoice.client_name}</p>
              <p><strong>Total TTC:</strong> {formatCurrency(selectedInvoice.total_ttc)}</p>
              <p><strong>Déjà payé:</strong> {formatCurrency(selectedInvoice.acompte)}</p>
              <p className="font-semibold text-amber-600"><strong>Reste à payer:</strong> {formatCurrency(selectedInvoice.reste_a_payer)}</p>
            </div>
          )}
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div>
              <Label htmlFor="amount">Montant de l'acompte (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="Ex: 300"
                required
                data-testid="payment-amount"
              />
            </div>
            <div>
              <Label htmlFor="payment_date">Date du paiement</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="payment_method">Mode de paiement</Label>
              <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virement">Virement bancaire</SelectItem>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="carte">Carte bancaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Input
                id="notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Ex: Acompte à la signature"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving} data-testid="save-payment-btn">
                {saving ? "Enregistrement..." : "Ajouter l'acompte"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
