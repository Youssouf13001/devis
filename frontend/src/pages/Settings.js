import { useState, useEffect } from "react";
import { getCompanySettings, updateCompanySettings } from "../lib/api";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Save, Building2, CreditCard } from "lucide-react";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    status: "",
    siren: "",
    tva_number: "",
    bank_name: "",
    iban: "",
    bic: "",
    logo_url: ""
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await getCompanySettings();
      setFormData({
        name: response.data.name || "",
        address: response.data.address || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        status: response.data.status || "",
        siren: response.data.siren || "",
        tva_number: response.data.tva_number || "",
        bank_name: response.data.bank_name || "",
        iban: response.data.iban || "",
        bic: response.data.bic || "",
        logo_url: response.data.logo_url || ""
      });
    } catch (error) {
      toast.error("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCompanySettings(formData);
      toast.success("Paramètres enregistrés");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in max-w-4xl" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
          Paramètres
        </h1>
        <p className="text-slate-500 mt-1">Configurez les informations de votre entreprise</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Building2 className="text-slate-600" size={24} />
              </div>
              <div>
                <CardTitle style={{ fontFamily: 'Manrope' }}>Informations de l'entreprise</CardTitle>
                <CardDescription>Ces informations apparaîtront sur vos devis et factures</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom de l'entreprise</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="CREATIVINDUSTRY"
                  data-testid="company-name-input"
                />
              </div>
              <div>
                <Label htmlFor="status">Statut juridique</Label>
                <Input
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  placeholder="Entrepreneur individuel"
                  data-testid="company-status-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="15 RUE AUGER, 13004 MARSEILLE - France"
                data-testid="company-address-input"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@creativindustry.com"
                  data-testid="company-email-input"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="06 68 89 69 96"
                  data-testid="company-phone-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siren">Numéro SIREN</Label>
                <Input
                  id="siren"
                  value={formData.siren}
                  onChange={(e) => setFormData({ ...formData, siren: e.target.value })}
                  placeholder="951.984.111"
                  data-testid="company-siren-input"
                />
              </div>
              <div>
                <Label htmlFor="tva_number">Numéro de TVA</Label>
                <Input
                  id="tva_number"
                  value={formData.tva_number}
                  onChange={(e) => setFormData({ ...formData, tva_number: e.target.value })}
                  placeholder="FR66951984111"
                  data-testid="company-tva-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <CreditCard className="text-slate-600" size={24} />
              </div>
              <div>
                <CardTitle style={{ fontFamily: 'Manrope' }}>Informations bancaires</CardTitle>
                <CardDescription>Pour les virements de vos clients</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bank_name">Nom de la banque</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="QONTO"
                data-testid="bank-name-input"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  placeholder="FR7616958000010827407974101"
                  className="font-mono"
                  data-testid="bank-iban-input"
                />
              </div>
              <div>
                <Label htmlFor="bic">BIC</Label>
                <Input
                  id="bic"
                  value={formData.bic}
                  onChange={(e) => setFormData({ ...formData, bic: e.target.value })}
                  placeholder="QNTOFRP1XXX"
                  className="font-mono"
                  data-testid="bank-bic-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2" data-testid="save-settings-btn">
            <Save size={18} />
            {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
