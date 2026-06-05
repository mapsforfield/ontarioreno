import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { usePortalAuth } from '../auth';

type LoginLocationState = {
  from?: {
    pathname?: string;
  };
};

export default function PortalLogin() {
  const { currentUser, login, users } = usePortalAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LoginLocationState | null;
  const redirectTo = state?.from?.pathname ?? '/portal/dashboard';

  if (currentUser) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  const handleLogin = (userId: string) => {
    if (login(userId)) {
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <main className="min-h-screen bg-[#071525] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <section>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
              <LockKeyhole className="h-3.5 w-3.5" />
              Private broker access
            </div>
            <img
              src="/logo-white.png"
              alt="OntarioReno"
              className="mt-7 h-14 w-auto"
            />
            <h1 className="mt-8 max-w-xl text-4xl font-black leading-[1.02] tracking-[-0.02em] sm:text-5xl">
              Renovation sales, deal flow, and contractor access in one portal.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-blue-50/75">
              Phase 1 creates the private routing, role gates, and polished
              shell that later CRM, commission, and contractor network tools can
              plug into.
            </p>
          </section>

          <section className="rounded-[0.5rem] border border-white/12 bg-white p-4 text-slate-950 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#32639b]">
                  Mock authentication
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                  Choose your portal user
                </h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleLogin(user.id)}
                  className="group flex items-center justify-between rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] px-4 py-4 text-left shadow-sm transition hover:border-[#9fbad8] hover:bg-white"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#071525] text-sm font-black text-white">
                      {user.avatarInitial}
                    </span>
                    <span>
                      <span className="block text-base font-black">
                        {user.name}
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold text-slate-500">
                        {user.role === 'admin' ? 'Admin access' : 'Rep access'}
                      </span>
                    </span>
                  </span>
                  <ArrowRight className="h-4.5 w-4.5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#1B3C6C]" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
