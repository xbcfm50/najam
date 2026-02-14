import { notFound } from 'next/navigation';
import { lockBillingRun, toggleBillingRunPaid } from '@/app/actions/billing-runs';
import { createClient } from '@/lib/supabase/server';
import { formatEur } from '@/lib/utils/currency';

export default async function BillingRunDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: run } = await supabase
    .from('billing_runs')
    .select('*, apartments(name)')
    .eq('id', params.id)
    .maybeSingle();

  if (!run) notFound();

  const { data: bills } = await supabase
    .from('utility_bills')
    .select('id,received_on,period_year,period_month,amount_eur,utility_types(name)')
    .eq('billing_run_id', run.id)
    .order('received_on', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Billing Run {run.billing_year}-{String(run.billing_month).padStart(2, '0')}</h1>
      <div className="rounded border bg-white p-4 space-y-1">
        <div>Apartment: {run.apartments?.name}</div>
        <div>Cutoff date: {run.cutoff_date}</div>
        <div>Rent: {formatEur(run.rent_amount_eur)}</div>
        <div>Utilities total: {formatEur(run.utilities_total_eur)}</div>
        <div>Total: {formatEur(run.total_eur)}</div>
        <div className="flex gap-2 pt-2"><span className="rounded bg-slate-100 px-2 py-1 text-sm">{run.is_locked ? 'LOCKED' : 'UNLOCKED'}</span><span className="rounded bg-slate-100 px-2 py-1 text-sm">{run.is_paid ? 'PAID' : 'UNPAID'}</span></div>
      </div>

      {!run.is_locked ? (
        <form action={lockBillingRun}>
          <input type="hidden" name="id" value={run.id} />
          <button className="rounded bg-slate-900 px-4 py-2 text-white">Lock billing run</button>
        </form>
      ) : (
        <form action={toggleBillingRunPaid}>
          <input type="hidden" name="id" value={run.id} />
          <input type="hidden" name="is_paid" value={(!run.is_paid).toString()} />
          <button className="rounded border px-4 py-2">Mark as {run.is_paid ? 'unpaid' : 'paid'}</button>
        </form>
      )}

      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold mb-2">Assigned bills</h2>
        <table className="w-full text-left text-sm"><thead><tr><th>Received On</th><th>Utility</th><th>Consumption Period</th><th>Amount</th></tr></thead><tbody>
          {(bills ?? []).map((bill: any) => (
            <tr key={bill.id} className="border-t"><td>{bill.received_on}</td><td>{bill.utility_types?.name}</td><td>{bill.period_year}-{String(bill.period_month).padStart(2, '0')}</td><td>{formatEur(bill.amount_eur)}</td></tr>
          ))}
        </tbody></table>
      </section>
    </div>
  );
}
