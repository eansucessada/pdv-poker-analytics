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
 */
const AuthGate: React.FC<Props> = ({ children }) => {
  const { loading, user, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="px-4 md:px-8 pt-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between gap-4 shadow-xl">
          <div className="text-slate-300 text-xs md:text-sm">
            Logado como <span className="font-semibold text-white">{user.email}</span>
          </div>
          <button
            onClick={() => void signOut()}
            className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all text-[10px] font-black uppercase tracking-widest"
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
