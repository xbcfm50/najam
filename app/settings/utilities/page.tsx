import { createUtilityType, updateUtilityType } from '@/app/actions/utilities';
import { createClient } from '@/lib/supabase/server';

export default async function UtilitiesSettingsPage() {
  const supabase = createClient();
  const { data: utilityTypes } = await supabase.from('utility_types').select('id,name,due_days_after_period_end,active').order('name');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Utility types</h1>

      <form action={createUtilityType} className="rounded border bg-white p-4 grid grid-cols-4 gap-2">
        <input name="name" className="rounded border p-2" placeholder="Name" required />
        <input name="due_days_after_period_end" type="number" min="0" max="60" defaultValue={10} className="rounded border p-2" required />
        <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked />Active</label>
        <button className="rounded bg-slate-900 px-4 py-2 text-white">Create</button>
      </form>

      {(utilityTypes ?? []).map((type) => (
        <form key={type.id} action={updateUtilityType} className="rounded border bg-white p-4 grid grid-cols-5 gap-2">
          <input type="hidden" name="id" value={type.id} />
          <input name="name" defaultValue={type.name} className="rounded border p-2" required />
          <input name="due_days_after_period_end" type="number" min="0" max="60" defaultValue={type.due_days_after_period_end} className="rounded border p-2" required />
          <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={type.active} />Active</label>
          <button className="rounded border px-4 py-2">Update</button>
        </form>
      ))}
    </div>
  );
}
