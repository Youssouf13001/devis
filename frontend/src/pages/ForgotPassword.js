import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import api from "../lib/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSubmitted(true);
      toast.success("Email envoyé si le compte existe");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-[#020617]">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[128px]"></div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card p-8 space-y-8 animate-slide-in">
          {!submitted ? (
            <>
              {/* Header */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/30 blur-xl rounded-full"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                    <Mail size={28} className="text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Manrope' }}>
                    Mot de passe oublié ?
                  </h1>
                  <p className="text-slate-400 mt-2">
                    Entrez votre email pour recevoir un lien de réinitialisation
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="forgot-password-email"
                    className="h-12 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20 rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold btn-glow rounded-xl"
                  disabled={loading}
                  data-testid="forgot-password-submit"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Envoi en cours...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Mail size={20} />
                      Envoyer le lien
                    </span>
                  )}
                </Button>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="flex flex-col items-center space-y-6 py-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/30 blur-xl rounded-full"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle size={40} className="text-white" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">
                  Email envoyé !
                </h2>
                <p className="text-slate-400">
                  Si un compte existe avec l'adresse <span className="text-amber-400">{email}</span>, 
                  vous recevrez un email avec les instructions de réinitialisation.
                </p>
              </div>
              <div className="text-sm text-slate-500 text-center">
                <p>Pensez à vérifier vos spams.</p>
                <p>Le lien est valable pendant 1 heure.</p>
              </div>
            </div>
          )}

          {/* Back to login link */}
          <div className="flex justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors"
              data-testid="back-to-login"
            >
              <ArrowLeft size={18} />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
