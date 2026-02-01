import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Eye, EyeOff, FileText } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Connexion réussie");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <img 
              src="https://customer-assets.emergentagent.com/job_df4bb327-88bd-4623-9022-ebd45334706b/artifacts/7xmtrxds_Nvo%20logo%20Creativindustry%20France.png" 
              alt="CREATIVINDUSTRY France" 
              className="h-20 object-contain"
            />
          </div>

          <Card className="border-0 shadow-none">
            <CardHeader className="px-0">
              <CardTitle className="text-3xl font-bold" style={{ fontFamily: 'Manrope' }}>
                Connexion
              </CardTitle>
              <CardDescription className="text-slate-500 text-base">
                Accédez à votre espace de gestion de devis
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="login-email"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="login-password"
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={loading}
                  data-testid="login-submit"
                >
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Image */}
      <div
        className="hidden lg:block lg:w-1/2 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1586745370973-343d1ba81ed2?crop=entropy&cs=srgb&fm=jpg&q=85')"
        }}
      >
        <div className="h-full w-full bg-slate-900/60 flex items-center justify-center p-12">
          <div className="text-center text-white max-w-lg">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Manrope' }}>
              Gérez vos devis simplement
            </h2>
            <p className="text-lg text-slate-200">
              Créez, envoyez et suivez vos devis professionnels en quelques clics.
              Transformez vos devis acceptés en factures automatiquement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
