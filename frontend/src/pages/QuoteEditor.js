import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuote, createQuote, updateQuote, getClients, getServices, getCompanySettings } from "../lib/api";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Save, Eye } from "lucide-react";

const QuoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [company, setCompany] = useState(null);

  const [formData, setFormData] = useState({
    client_id: "",
    expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_date: "",
    items: [],
    discount: 0,
    notes: ""
  });

  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [clientsRes, servicesRes, companyRes] = await Promise.all([
        getClients(),
        getServices(),
        getCompanySettings()
      ]);
      setClients(clientsRes.data);
      setServices(servicesRes.data);
      setCompany(companyRes.data);

      if (isEditing) {
        const quoteRes = await getQuote(id);
        const quote = quoteRes.data;
        setFormData({
          client_id: quote.client_id,
          expiration_date: quote.expiration_date,
          event_date: quote.event_date || "",
          items: quote.items,
          discount: quote.discount,
          notes: quote.notes || ""
        });
        const client = clientsRes.data.find(c => c.id === quote.client_id);
        setSelectedClient(client);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (clientId) => {
    setFormData({ ...formData, client_id: clientId });
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { service_name: "", quantity: 1, unit: "heure", price_ht: 0, tva_rate: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const addServiceToItems = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setFormData({
        ...formData,
        items: [...formData.items, {
          service_name: service.name,
          quantity: 1,
          unit: service.unit,
          price_ht: service.price_ht,
          tva_rate: service.tva_rate
        }]
      });
    }
  };

  const calculateTotals = () => {
    const totalHtBeforeDiscount = formData.items.reduce((sum, item) => sum + (item.quantity * item.price_ht), 0);
    const totalHt = totalHtBeforeDiscount - formData.discount;
    const totalTva = formData.items.reduce((sum, item) => sum + (item.quantity * item.price_ht * (item.tva_rate / 100)), 0);
    const totalTtc = totalHt + totalTva;
    return { totalHtBeforeDiscount, totalHt, totalTva, totalTtc };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_id) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (formData.items.length === 0) {
      toast.error("Veuillez ajouter au moins une prestation");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await updateQuote(id, formData);
        toast.success("Devis mis à jour");
      } else {
        await createQuote(formData);
        toast.success("Devis créé");
      }
      navigate("/quotes");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in" data-testid="quote-editor">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/quotes")}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            {isEditing ? "Modifier le devis" : "Nouveau devis"}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <Card>
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Manrope' }} className="text-amber-700">Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Sélectionner un client</Label>
                  <Select value={formData.client_id} onValueChange={handleClientChange}>
                    <SelectTrigger data-testid="client-select">
                      <SelectValue placeholder="Choisir un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date d'expiration du devis</Label>
                    <Input
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                      data-testid="expiration-date"
                    />
                  </div>
                  <div>
                    <Label>Date de l'événement (mariage)</Label>
                    <Input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      data-testid="event-date"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle style={{ fontFamily: 'Manrope' }}>Prestations</CardTitle>
                <Select onValueChange={addServiceToItems}>
                  <SelectTrigger className="w-48" data-testid="add-service-select">
                    <SelectValue placeholder="Ajouter prestation" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - {formatCurrency(service.price_ht)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.items.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>Aucune prestation ajoutée</p>
                    <Button type="button" variant="outline" className="mt-4" onClick={addItem}>
                      <Plus size={16} className="mr-2" /> Ajouter manuellement
                    </Button>
                  </div>
                ) : (
                  formData.items.map((item, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 mr-4">
                          <Label>Désignation</Label>
                          <Input
                            value={item.service_name}
                            onChange={(e) => updateItem(index, 'service_name', e.target.value)}
                            placeholder="Nom de la prestation"
                            data-testid={`item-name-${index}`}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <Label>Quantité</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            data-testid={`item-qty-${index}`}
                          />
                        </div>
                        <div>
                          <Label>Unité</Label>
                          <Input
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            placeholder="heure"
                          />
                        </div>
                        <div>
                          <Label>Prix HT</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price_ht}
                            onChange={(e) => updateItem(index, 'price_ht', parseFloat(e.target.value) || 0)}
                            data-testid={`item-price-${index}`}
                          />
                        </div>
                        <div>
                          <Label>TVA %</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.tva_rate}
                            onChange={(e) => updateItem(index, 'tva_rate', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div className="text-right text-sm font-medium">
                        Total HT: <span className="font-mono">{formatCurrency(item.quantity * item.price_ht)}</span>
                      </div>
                    </div>
                  ))
                )}

                {formData.items.length > 0 && (
                  <Button type="button" variant="outline" className="w-full" onClick={addItem}>
                    <Plus size={16} className="mr-2" /> Ajouter une ligne
                  </Button>
                )}

                {/* Discount */}
                <div className="pt-4 border-t border-slate-200">
                  <Label>Remise (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    data-testid="discount-input"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Manrope' }}>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes additionnelles..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="submit" className="flex-1 gap-2" disabled={saving} data-testid="save-quote-btn">
                <Save size={18} />
                {saving ? "Enregistrement..." : "Enregistrer le devis"}
              </Button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div className="lg:sticky lg:top-8 h-fit">
          <Card className="bg-amber-100/50 border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700" style={{ fontFamily: 'Manrope' }}>
                <Eye size={20} /> Aperçu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white shadow-lg border border-amber-200 p-6 text-sm" style={{ aspectRatio: '210/297', overflow: 'auto' }}>
                {/* Company Header with Logo */}
                <div className="flex items-start gap-4 mb-6 pb-4 border-b-2 border-amber-600">
                  <img 
                    src="https://customer-assets.emergentagent.com/job_df4bb327-88bd-4623-9022-ebd45334706b/artifacts/qzra2tuw_logo%20entourer.png" 
                    alt="Logo" 
                    className="w-16 h-16 object-contain"
                  />
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-amber-700" style={{ fontFamily: 'Manrope' }}>
                      {company?.name || 'CREATIVINDUSTRY'}
                    </h2>
                    <div className="text-xs text-stone-500 mt-1 space-y-0.5">
                      <p>{company?.address}</p>
                      <p>{company?.email}</p>
                      <p>{company?.phone}</p>
                    </div>
                  </div>
                  <div className="text-right bg-amber-50 p-3 rounded">
                    <h3 className="text-amber-700 font-bold">DEVIS</h3>
                    <p className="text-xs mt-1"><strong>Date:</strong> {formatDate(new Date().toISOString().split('T')[0])}</p>
                    <p className="text-xs"><strong>Validité:</strong> {formatDate(formData.expiration_date)}</p>
                  </div>
                </div>

                {/* Client */}
                {selectedClient && (
                  <div className="mb-4">
                    <h4 className="text-amber-700 font-semibold text-xs mb-2">CLIENT</h4>
                    <div className="bg-amber-50 p-3 rounded text-xs">
                      <p className="font-semibold">{selectedClient.name}</p>
                      <p>{selectedClient.address}</p>
                      <p>{selectedClient.email}</p>
                    </div>
                    {formData.event_date && (
                      <p className="mt-2 text-xs font-semibold text-amber-700">
                        Date de l'événement: {formatDate(formData.event_date)}
                      </p>
                    )}
                  </div>
                )}

                {/* Items Table */}
                {formData.items.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-amber-700 font-semibold text-xs mb-2">PRESTATIONS</h4>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-amber-600 text-white">
                          <th className="p-2 text-left">Désignation</th>
                          <th className="p-2 text-right">Qté</th>
                          <th className="p-2 text-right">Prix HT</th>
                          <th className="p-2 text-right">Total HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                            <td className="p-2">{item.service_name || '-'}</td>
                            <td className="p-2 text-right">{item.quantity} {item.unit}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(item.price_ht)}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(item.quantity * item.price_ht)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-48 text-xs">
                    <div className="flex justify-between py-1 border-b border-amber-100">
                      <span>Total HT avant remise</span>
                      <span className="font-mono">{formatCurrency(totals.totalHtBeforeDiscount)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-amber-100">
                      <span>Remise</span>
                      <span className="font-mono">{formatCurrency(formData.discount)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-amber-100">
                      <span>Total HT</span>
                      <span className="font-mono">{formatCurrency(totals.totalHt)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-amber-100">
                      <span>Total TVA</span>
                      <span className="font-mono">{formatCurrency(totals.totalTva)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-white bg-amber-600 px-2 rounded">
                      <span>TOTAL TTC</span>
                      <span className="font-mono">{formatCurrency(totals.totalTtc)}</span>
                    </div>
                  </div>
                </div>

                {/* Bank Info */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded text-xs">
                  <p className="font-semibold text-amber-700 mb-1">COORDONNÉES BANCAIRES</p>
                  <p><strong>Établissement:</strong> {company?.bank_name || 'QONTO'}</p>
                  <p><strong>IBAN:</strong> {company?.iban}</p>
                  <p><strong>BIC:</strong> {company?.bic}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuoteEditor;
