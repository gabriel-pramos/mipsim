import { Outlet, NavLink } from 'react-router';
import { ProcessorProvider } from '../core/processorContext';

export default function AppLayout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive
        ? 'text-zinc-900 border-b-2 border-zinc-900'
        : 'text-zinc-500 border-b-2 border-transparent hover:text-zinc-700'
    }`;

  return (
    <ProcessorProvider>
      <div className="h-screen bg-zinc-50 font-sans flex flex-col overflow-hidden">
        <header className="bg-white border-b border-zinc-200 shrink-0">
          <div className="max-w-[1800px] mx-auto px-6 flex items-center gap-8 h-12">
            <span className="text-sm font-semibold tracking-tight text-zinc-900">
              MIPSim
            </span>
            <nav className="flex items-center gap-1 h-full">
              <NavLink to="/" end className={linkClass}>
                Editor
              </NavLink>
              <NavLink to="/simulator" className={linkClass}>
                Simulator
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="flex-1 min-h-0 flex flex-col">
          <Outlet />
        </main>
      </div>
    </ProcessorProvider>
  );
}
