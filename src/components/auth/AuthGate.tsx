import React from "react";
import AuthPage from "./AuthPage";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  children: React.ReactNode;
}

/**
 * AuthGate
 * - Se não estiver logado, mostra a tela de login
 * - Se estiver logado, renderiza o app
 *
 * Integração simples:
 *   <AuthGate>
 *     <SeuApp />
 *   </AuthGate>
 */
const AuthGate: React.FC<Props> = ({ children }) => {
  const { loading, user, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="animate-pulse text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] text-center">
            Carregando sessão...
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Barra discreta de sessão (opcional) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
            Sessão: <span className="text-white">{user.email ?? "usuário"}</span>
          </div>
          <button
            onClick={() => void signOut()}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            Sair
          </button>
        </div>
      </div>

      {children}
    </div>
  );
};

export default AuthGate;
