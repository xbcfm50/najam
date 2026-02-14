import { createApartment, createRentPrice, updateApartment } from '@/app/actions/apartments';
import { createClient } from '@/lib/supabase/server';
import { formatEur } from '@/lib/utils/currency';

export default async function ApartmentsSettingsPage() {
  const supabase = createClient();
  const { data: apartments } = await supabase.from('apartments').select('id,name,active').order('name');

  const apartmentData = await Promise.all((apartments ?? []).map(async (apartment) => {
    const { data: rentPrices } = await supabase.from('rent_prices').select('id,valid_from,amount_eur').eq('apartment_id', apartment.id).order('valid_from', { ascending: false });
    return { apartment, rentPrices: rentPrices ?? [] };
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Apartments</h1>

      <form action={createApartment} className="rounded border bg-white p-4 space-y-2">
        <h2 className="font-semibold">Create apartment</h2>
        <input name="name" className="w-full rounded border p-2" placeholder="Apartment name" required />
        <button className="rounded bg-slate-900 px-4 py-2 text-white">Create</button>
      </form>

      {apartmentData.map(({ apartment, rentPrices }) => (
        <section key={apartment.id} className="rounded border bg-white p-4 space-y-3">
          <form action={updateApartment} className="space-y-2">
            <input type="hidden" name="id" value={apartment.id} />
            <input name="name" defaultValue={apartment.name} className="w-full rounded border p-2" required />
            <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={apartment.active} /> Active</label>
            <button className="rounded border px-3 py-1">Update apartment</button>
          </form>

          <div>
            <h3 className="font-semibold">Rent prices</h3>
            <ul className="mb-2 text-sm">
              {rentPrices.map((price) => <li key={price.id}>{price.valid_from}: {formatEur(price.amount_eur)}</li>)}
            </ul>
            <form action={createRentPrice} className="grid grid-cols-3 gap-2">
              <input type="hidden" name="apartment_id" value={apartment.id} />
              <input name="valid_from" type="date" className="rounded border p-2" required />
              <input name="amount_eur" type="number" step="0.01" min="0" className="rounded border p-2" placeholder="EUR" required />
              <button className="rounded border px-3 py-1">Add rent price</button>
            </form>
          </div>
        </section>
      ))}
    </div>
  );
}
