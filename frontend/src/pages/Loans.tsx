import LoansTab from '../components/loans/LoansTab';

const Loans = () => {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white/85 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Finanzas</p>
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Préstamos</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Gestión de préstamos y financiamiento</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="p-3 sm:p-6">
          <LoansTab />
        </div>
      </div>
    </div>
  );
};

export default Loans;
