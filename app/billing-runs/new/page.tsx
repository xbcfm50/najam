import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { createBillingRunDraft, lockBillingRun } from '@/app/actions/billing-runs';
import { computeCutoffDate, firstDayOfMonth, suggestedBillingPeriod } from '@/lib/utils/date';
import { formatEur } from '@/lib/utils/currency';

export default async function NewBillingRunPage({ searchParams }: { searchParams: { apartment?: string; year?: string; month?: string } }) {
  const supabase = createClient();
  const suggested = suggestedBillingPeriod(new Date());
  const year = Number(searchParams.year ?? suggested.year);
  const month = Number(searchParams.month ?? suggested.month);

  const [{ data: apartments }, { data: settings }] = await Promise.all([
    supabase.from('apartments').select('id,name').eq('active', true).order('name'),
    supabase.from('app_settings').select('default_cutoff_day').maybeSingle()
  ]);

  const apartmentId = searchParams.apartment ?? apartments?.[0]?.id;
  const cutoffDay = settings?.default_cutoff_day ?? 3;
  const cutoffDate = format(computeCutoffDate(year, month, cutoffDay), 'yyyy-MM-dd');
  const firstDay = format(firstDayOfMonth(year, month), 'yyyy-MM-dd');

  const { data: rentPrice } = apartmentId
    ? await supabase.from('rent_prices').select('amount_eur').eq('apartment_id', apartmentId).lte('valid_from', firstDay).order('valid_from', { ascending: false }).limit(1).maybeSingle()
    : { data: null as any };

  const { data: previewBills } = apartmentId
    ? await supabase.from('utility_bills').select('id,received_on,period_year,period_month,amount_eur,utility_types(name)').eq('apartment_id', apartmentId).is('billing_run_id', null).lte('received_on', cutoffDate).order('received_on', { ascending: false })
    : { data: [] as any[] };

  const utilitiesTotal = (previewBills ?? []).reduce((sum, b: any) => sum + Number(b.amount_eur), 0);
  const rentAmount = Number(rentPrice?.amount_eur ?? 0);

  const { data: existingDraft } = apartmentId
    ? await supabase.from('billing_runs').select('id,is_locked').eq('apartment_id', apartmentId).eq('billing_year', year).eq('billing_month', month).maybeSingle()
    : { data: null as any };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New billing run</h1>
      <section className="rounded border bg-white p-4 space-y-2">
        <div>Apartment: {apartments?.find((a) => a.id === apartmentId)?.name ?? 'N/A'}</div>
        <div>Billing Period: {year}-{String(month).padStart(2, '0')}</div>
        <div>Cutoff Day: {cutoffDay}</div>
        <div>Cutoff Date: {cutoffDate}</div>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Rent</h2>
        <p>{rentPrice ? formatEur(rentAmount) : 'Missing rent price for this period.'}</p>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 font-semibold">Eligible bills preview</h2>
        <table className="w-full text-left text-sm"><thead><tr><th>Received On</th><th>Utility</th><th>Consumption Period</th><th>Amount</th></tr></thead><tbody>
          {(previewBills ?? []).map((bill: any) => (
            <tr key={bill.id} className="border-t"><td>{bill.received_on}</td><td>{bill.utility_types?.name}</td><td>{bill.period_year}-{String(bill.period_month).padStart(2, '0')}</td><td>{formatEur(bill.amount_eur)}</td></tr>
          ))}
        </tbody></table>
        <p className="mt-3">Utilities total: {formatEur(utilitiesTotal)}</p>
        <p>Total: {formatEur(utilitiesTotal + rentAmount)}</p>
      </section>

      {!existingDraft ? (
        <form action={createBillingRunDraft}>
          <input type="hidden" name="apartment_id" value={apartmentId} />
          <input type="hidden" name="billing_year" value={year} />
          <input type="hidden" name="billing_month" value={month} />
          <button disabled={!rentPrice || !apartmentId} className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50">Create draft</button>
        </form>
      ) : !existingDraft.is_locked ? (
        <form action={lockBillingRun}>
          <input type="hidden" name="id" value={existingDraft.id} />
          <button disabled={!rentPrice} className="rounded bg-slate-900 px-4 py-2 text-white">Lock billing run</button>
        </form>
      ) : null}
    </div>
  );
}
