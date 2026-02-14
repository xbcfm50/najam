import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { computeDueDate, lastCompletedConsumptionPeriod, suggestedBillingPeriod } from '@/lib/utils/date';
import { formatEur } from '@/lib/utils/currency';

export default async function DashboardPage() {
  const supabase = createClient();
  const today = new Date();
  const suggested = suggestedBillingPeriod(today);
  const period = lastCompletedConsumptionPeriod(today);

  const [{ data: apartments }, { data: utilityTypes }, { data: openBills }, { data: unpaidRuns }, { data: recentRuns }] = await Promise.all([
    supabase.from('apartments').select('id,name').eq('active', true).order('name'),
    supabase.from('utility_types').select('id,name,due_days_after_period_end').eq('active', true).order('name'),
    supabase.from('utility_bills').select('amount_eur').is('billing_run_id', null),
    supabase.from('billing_runs').select('id').eq('is_paid', false),
    supabase.from('billing_runs').select('id,billing_year,billing_month,total_eur,is_locked,is_paid,apartments(name)').order('created_at', { ascending: false }).limit(10)
  ]);

  const alerts: Array<{ apartment: string; utility: string; dueDate: Date; lateDays: number }> = [];

  for (const apartment of apartments ?? []) {
    for (const utility of utilityTypes ?? []) {
      const dueDate = computeDueDate(period.year, period.month, utility.due_days_after_period_end);
      const shouldAlert = today > dueDate;
      if (!shouldAlert) continue;

      const { data: existing } = await supabase
        .from('utility_bills')
        .select('id')
        .eq('apartment_id', apartment.id)
        .eq('utility_type_id', utility.id)
        .eq('period_year', period.year)
        .eq('period_month', period.month)
        .maybeSingle();

      if (!existing) {
        alerts.push({
          apartment: apartment.name,
          utility: utility.name,
          dueDate,
          lateDays: differenceInDays(today, dueDate)
        });
      }
    }
  }

  const openCount = openBills?.length ?? 0;
  const openTotal = (openBills ?? []).reduce((acc, item) => acc + Number(item.amount_eur), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded border bg-white p-4">
          <p className="text-sm text-slate-500">Suggested Billing Run</p>
          <p className="text-lg font-semibold">{suggested.year}-{String(suggested.month).padStart(2, '0')}</p>
          <Link href={`/app/billing-runs/new?year=${suggested.year}&month=${suggested.month}`} className="mt-2 inline-block rounded bg-slate-900 px-3 py-1 text-white">Create billing run</Link>
        </div>
        <div className="rounded border bg-white p-4"><p className="text-sm text-slate-500">Open Utility Bills</p><p className="text-lg font-semibold">{openCount}</p><p>{formatEur(openTotal)}</p></div>
        <div className="rounded border bg-white p-4"><p className="text-sm text-slate-500">Unpaid Billing Runs</p><p className="text-lg font-semibold">{unpaidRuns?.length ?? 0}</p></div>
        <div className="rounded border bg-white p-4"><p className="text-sm text-slate-500">Alerts</p><p className="text-lg font-semibold">{alerts.length}</p></div>
      </div>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Alerts</h2>
        <table className="w-full text-left text-sm"><thead><tr><th>Apartment</th><th>Utility</th><th>Period</th><th>Due Date</th><th>Days Late</th></tr></thead><tbody>
          {alerts.map((alert, idx) => (
            <tr key={idx} className="border-t"><td>{alert.apartment}</td><td>{alert.utility}</td><td>{period.year}-{String(period.month).padStart(2, '0')}</td><td>{format(alert.dueDate, 'yyyy-MM-dd')}</td><td>{alert.lateDays}</td></tr>
          ))}
        </tbody></table>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Recent Billing Runs</h2>
        <table className="w-full text-left text-sm"><thead><tr><th>Period</th><th>Apartment</th><th>Total (EUR)</th><th>Locked</th><th>Paid</th><th>View</th></tr></thead><tbody>
          {(recentRuns ?? []).map((run: any) => (
            <tr key={run.id} className="border-t"><td>{run.billing_year}-{String(run.billing_month).padStart(2, '0')}</td><td>{run.apartments?.name}</td><td>{formatEur(run.total_eur)}</td><td>{run.is_locked ? 'Yes' : 'No'}</td><td>{run.is_paid ? 'Yes' : 'No'}</td><td><Link href={`/app/billing-runs/${run.id}`} className="underline">View</Link></td></tr>
          ))}
        </tbody></table>
      </section>
    </div>
  );
}
