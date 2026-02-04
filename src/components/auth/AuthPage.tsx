import React, { useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

type Mode = "sign_in" | "sign_up" | "reset";

const pill =
  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all";
const inputBase =
  "w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600/40";

const AuthPage: React.FC = () => {
  const { loading, user, lastError, clearError, signIn, signUp, sendPasswordReset } =
    useAuth();

  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const title = useMemo(() => {
    if (mode === "sign_up") return "Criar conta";
    if (mode === "reset") return "Recuperar senha";
    return "Entrar";
  }, [mode]);

  const subtitle = useMemo(() => {
    if (mode === "sign_up") return "Crie seu usuário para começar a importar e visualizar dados.";
    if (mode === "reset") return "Vamos te mandar um e-mail para redefinir sua senha.";
    return "Entre com seu e-mail e senha para acessar seus dados.";
  }, [mode]);

  const canSubmit = useMemo(() => {
    if (!email.trim()) return false;
    if (mode === "reset") return true;
    return password.length >= 6;
  }, [email, password, mode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setToast(null);

    if (!canSubmit || busy) return;

    setBusy(true);
    try {
      if (mode === "sign_in") {
        const ok = await signIn(email.trim(), password);
        if (!ok) return;
      } else if (mode === "sign_up") {
        const ok = await signUp(email.trim(), password);
        if (!ok) return;
        setToast(
          "Conta criada! Se você ativou confirmação por e-mail no Supabase, confira sua caixa de entrada."
        );
      } else {
        const ok = await sendPasswordReset(email.trim());
        if (!ok) return;
        setToast("E-mail de recuperação enviado. Confira sua caixa de entrada.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center justify-center gap-3">
            <span className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
            PDV POKER<span className="text-blue-500">ANALYTICS</span>
          </h1>
          <p className="text-slate-500 mt-2 font-black uppercase tracking-[0.3em] text-[10px]">
            Professional Data Visualization Engine
          </p>
        </div>

        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-2 bg-slate-900/40 border-b border-slate-800 flex gap-1">
            <button
              type="button"
              onClick={() => {
                setMode("sign_in");
                setToast(null);
                clearError();
              }}
              className={`${pill} ${
                mode === "sign_in" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("sign_up");
                setToast(null);
                clearError();
              }}
              className={`${pill} ${
                mode === "sign_up" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
              }`}
            >
              Criar conta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                setToast(null);
                clearError();
              }}
              className={`${pill} ${
                mode === "reset" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white"
              }`}
            >
              Esqueci a senha
            </button>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-white font-black text-xl tracking-tight">{title}</h2>
                <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
              </div>

              <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                <span className={`px-3 py-1 rounded-full border ${user ? "border-blue-500/40 text-blue-400" : "border-slate-800 text-slate-600"}`}>
                  {user ? "Logado" : "Deslogado"}
                </span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                  E-mail
                </label>
                <input
                  className={inputBase}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => {
                    setToast(null);
                    clearError();
                  }}
                  type="email"
                  placeholder="voce@exemplo.com"
                  autoComplete="email"
                />
              </div>

              {mode !== "reset" && (
                <div>
                  <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      className={inputBase + " pr-12"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => {
                        setToast(null);
                        clearError();
                      }}
                      type={showPw ? "text" : "password"}
                      placeholder="mínimo 6 caracteres"
                      autoComplete={mode === "sign_in" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 text-slate-500 hover:text-white transition-colors text-xs font-black"
                      aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              )}

              {(lastError || toast) && (
                <div
                  className={`rounded-2xl border p-4 text-sm ${
                    lastError
                      ? "border-red-500/30 bg-red-950/30 text-red-200"
                      : "border-blue-500/30 bg-blue-950/30 text-blue-200"
                  }`}
                >
                  {lastError ?? toast}
                </div>
              )}

              <button
                disabled={loading || busy || !canSubmit}
                className={`w-full rounded-2xl py-3 text-[11px] font-black uppercase tracking-[0.3em] transition-all ${
                  loading || busy || !canSubmit
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-blue-600 text-white shadow-lg hover:shadow-blue-600/20 hover:bg-blue-500"
                }`}
              >
                {busy ? "Processando..." : mode === "sign_up" ? "Criar conta" : mode === "reset" ? "Enviar e-mail" : "Entrar"}
              </button>

              <div className="pt-2 text-center text-slate-600 text-[11px]">
                <span className="font-black">Dica:</span> para testar dois usuários ao mesmo tempo, abra uma janela
                anônima e faça login com outro e-mail.
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center text-slate-700 text-[9px] font-black uppercase tracking-[0.5em]">
          &copy; {new Date().getFullYear()} professional analytics engine
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
