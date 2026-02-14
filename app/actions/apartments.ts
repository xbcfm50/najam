'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const createApartmentSchema = z.object({ name: z.string().min(1), active: z.coerce.boolean().default(true) });
const updateApartmentSchema = z.object({ id: z.string().uuid(), name: z.string().min(1), active: z.coerce.boolean() });
const createRentPriceSchema = z.object({ apartment_id: z.string().uuid(), valid_from: z.string(), amount_eur: z.coerce.number().min(0) });

export async function createApartment(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const parsed = createApartmentSchema.parse({ name: formData.get('name'), active: formData.get('active') ?? true });
  const { error } = await supabase.from('apartments').insert({ ...parsed, user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath('/app/settings/apartments');
}

export async function updateApartment(formData: FormData) {
  const parsed = updateApartmentSchema.parse({
    id: formData.get('id'),
    name: formData.get('name'),
    active: formData.get('active') === 'on'
  });
  const supabase = createClient();
  const { error } = await supabase.from('apartments').update({ name: parsed.name, active: parsed.active }).eq('id', parsed.id);
  if (error) return { error: error.message };
  revalidatePath('/app/settings/apartments');
}

export async function createRentPrice(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const parsed = createRentPriceSchema.parse({
    apartment_id: formData.get('apartment_id'),
    valid_from: formData.get('valid_from'),
    amount_eur: formData.get('amount_eur')
  });

  const { error } = await supabase.from('rent_prices').insert({ ...parsed, user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath('/app/settings/apartments');
}
