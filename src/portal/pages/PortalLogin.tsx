import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { usePortalAuth } from '../auth';

type LoginLocationState = {
  from?: {
    pathname?: string;
  };
};

export default function PortalLogin() {
  const { currentUser, login } = usePortalAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const state = location.state as LoginLocationState | null;
  const redirectTo = state?.from?.pathname ?? '/portal/dashboard';

  if (currentUser) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const ok = await login(email, password);
    if (ok) {
      navigate(redirectTo, { replace: true });
      return;
    }

    setError('Invalid email or password, or this user is inactive.');
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
                  Private authentication
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                  Sign in to the portal
                </h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <form onSubmit={handleLogin} className="mt-5 grid gap-4">
              <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              {error && (
                <p className="rounded-[0.5rem] border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#153158]"
              >
                Sign In
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
