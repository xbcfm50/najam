import { format } from 'date-fns';
import { createUtilityBill } from '@/app/actions/bills';
import { createUtilityType } from '@/app/actions/utilities';
import { createClient } from '@/lib/supabase/server';

export default async function NewBillPage() {
  const supabase = createClient();
  const [{ data: apartments }, { data: utilityTypes }] = await Promise.all([
    supabase.from('apartments').select('id,name').eq('active', true).order('name'),
    supabase.from('utility_types').select('id,name').eq('active', true).order('name')
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New Utility Bill</h1>
      <form action={createUtilityBill} className="space-y-3 rounded border bg-white p-4">
        <select name="apartment_id" className="w-full rounded border p-2" required>
          <option value="">Select apartment</option>
          {(apartments ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select name="utility_type_id" className="w-full rounded border p-2" required>
          <option value="">Select utility type</option>
          {(utilityTypes ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input name="period" type="month" className="w-full rounded border p-2" required />
        <input name="received_on" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="w-full rounded border p-2" required />
        <input name="amount_eur" type="number" step="0.01" min="0" className="w-full rounded border p-2" required placeholder="Amount EUR" />
        <button className="rounded bg-slate-900 px-4 py-2 text-white">Save bill</button>
      </form>

      <details className="rounded border bg-white p-4">
        <summary className="cursor-pointer font-semibold">Add new utility type</summary>
        <form action={createUtilityType} className="mt-3 space-y-2">
          <input name="name" className="w-full rounded border p-2" placeholder="Name" required />
          <input name="due_days_after_period_end" type="number" min="0" max="60" defaultValue="10" className="w-full rounded border p-2" required />
          <button className="rounded border px-4 py-2">Create type</button>
        </form>
      </details>
    </div>
  );
}
