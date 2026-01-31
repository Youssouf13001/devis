import { useState, useEffect } from "react";
import { getServices, createService, updateService, deleteService } from "../lib/api";
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
import { Textarea } from "../components/ui/textarea";
import { Plus, Pencil, Trash2, Briefcase } from "lucide-react";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    unit: "heure", 
    price_ht: 0, 
    tva_rate: 0, 
    description: "" 
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await getServices();
      setServices(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des prestations");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({ 
        name: service.name, 
        unit: service.unit, 
        price_ht: service.price_ht, 
        tva_rate: service.tva_rate,
        description: service.description || ""
      });
    } else {
      setEditingService(null);
      setFormData({ name: "", unit: "heure", price_ht: 0, tva_rate: 0, description: "" });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...formData,
        price_ht: parseFloat(formData.price_ht) || 0,
        tva_rate: parseFloat(formData.tva_rate) || 0
      };
      if (editingService) {
        await updateService(editingService.id, data);
        toast.success("Prestation mise à jour");
      } else {
        await createService(data);
        toast.success("Prestation créée");
      }
      setDialogOpen(false);
      loadServices();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette prestation ?")) return;
    try {
      await deleteService(id);
      toast.success("Prestation supprimée");
      loadServices();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
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

  return (
    <div className="space-y-6 animate-slide-in" data-testid="services-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            Prestations
          </h1>
          <p className="text-slate-500 mt-1">{services.length} prestations au total</p>
        </div>
        <Button className="gap-2" onClick={() => openDialog()} data-testid="new-service-btn">
          <Plus size={20} />
          Nouvelle Prestation
        </Button>
      </div>

      {/* Services Table */}
      <Card>
        <CardContent className="p-0">
          {services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Briefcase className="text-slate-300 mb-4" size={64} />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune prestation</h3>
              <p className="text-slate-500 mb-4">Ajoutez vos prestations pour créer des devis plus rapidement</p>
              <Button onClick={() => openDialog()} data-testid="empty-new-service-btn">
                <Plus size={20} className="mr-2" />
                Ajouter une prestation
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Nom</TableHead>
                  <TableHead className="font-semibold">Unité</TableHead>
                  <TableHead className="font-semibold">Prix HT</TableHead>
                  <TableHead className="font-semibold">TVA</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.unit}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(service.price_ht)}</TableCell>
                    <TableCell>{service.tva_rate}%</TableCell>
                    <TableCell className="max-w-xs truncate">{service.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(service)}
                          data-testid={`edit-service-${service.id}`}
                        >
                          <Pencil size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(service.id)}
                          className="text-red-500 hover:text-red-700"
                          data-testid={`delete-service-${service.id}`}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Service Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope' }}>
              {editingService ? "Modifier la prestation" : "Nouvelle prestation"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de la prestation</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Prestation Photo"
                required
                data-testid="service-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">Unité</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="heure, jour, forfait..."
                  required
                  data-testid="service-unit-input"
                />
              </div>
              <div>
                <Label htmlFor="price_ht">Prix HT (€)</Label>
                <Input
                  id="price_ht"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price_ht}
                  onChange={(e) => setFormData({ ...formData, price_ht: e.target.value })}
                  required
                  data-testid="service-price-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tva_rate">Taux de TVA (%)</Label>
              <Input
                id="tva_rate"
                type="number"
                min="0"
                step="0.1"
                value={formData.tva_rate}
                onChange={(e) => setFormData({ ...formData, tva_rate: e.target.value })}
                placeholder="0 pour exonéré"
                data-testid="service-tva-input"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la prestation..."
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving} data-testid="save-service-btn">
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
