import { useState, useEffect } from "react";
import { getInvoices, updateInvoiceStatus } from "../lib/api";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Badge } from "../components/ui/badge";
import { MoreVertical, Receipt, CheckCircle, XCircle, Clock } from "lucide-react";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      "en attente": { label: "En attente", className: "bg-amber-100 text-amber-800" },
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
                  <TableHead className="font-semibold">Échéance</TableHead>
                  <TableHead className="font-semibold">Montant TTC</TableHead>
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
                    <TableCell>{formatDate(invoice.due_date)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(invoice.total_ttc)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`invoice-actions-${invoice.id}`}>
                            <MoreVertical size={20} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
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
    </div>
  );
};

export default Invoices;
