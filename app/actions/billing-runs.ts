'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { computeCutoffDate, firstDayOfMonth } from '@/lib/utils/date';

const createDraftSchema = z.object({
  apartment_id: z.string().uuid(),
  billing_year: z.coerce.number().int().min(2000).max(2100),
  billing_month: z.coerce.number().int().min(1).max(12)
});

const lockSchema = z.object({ id: z.string().uuid() });
const paidSchema = z.object({ id: z.string().uuid(), is_paid: z.coerce.boolean() });

export async function createBillingRunDraft(formData: FormData) {
  const parsed = createDraftSchema.parse({
    apartment_id: formData.get('apartment_id'),
    billing_year: formData.get('billing_year'),
    billing_month: formData.get('billing_month')
  });

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: settings } = await supabase
    .from('app_settings')
    .select('default_cutoff_day')
    .maybeSingle();

  const cutoffDay = settings?.default_cutoff_day ?? 3;
  const cutoffDate = format(
    computeCutoffDate(parsed.billing_year, parsed.billing_month, cutoffDay),
    'yyyy-MM-dd'
  );
  const firstDay = format(firstDayOfMonth(parsed.billing_year, parsed.billing_month), 'yyyy-MM-dd');

  const { data: rentRow } = await supabase
    .from('rent_prices')
    .select('amount_eur')
    .eq('apartment_id', parsed.apartment_id)
    .lte('valid_from', firstDay)
    .order('valid_from', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!rentRow) {
    return { error: 'Missing rent price for selected period.' };
  }

  const { data: bills } = await supabase
    .from('utility_bills')
    .select('amount_eur')
    .eq('apartment_id', parsed.apartment_id)
    .is('billing_run_id', null)
    .lte('received_on', cutoffDate);

  const utilities = (bills ?? []).reduce((acc, bill) => acc + Number(bill.amount_eur), 0);

  const { data, error } = await supabase
    .from('billing_runs')
    .insert({
      user_id: user.id,
      apartment_id: parsed.apartment_id,
      billing_year: parsed.billing_year,
      billing_month: parsed.billing_month,
      cutoff_day: cutoffDay,
      cutoff_date: cutoffDate,
      rent_amount_eur: Number(rentRow.amount_eur),
      utilities_total_eur: Number(utilities.toFixed(2)),
      total_eur: Number((Number(rentRow.amount_eur) + utilities).toFixed(2)),
      is_locked: false
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: 'Billing run already exists for this apartment and period.' };
    }

    return { error: error.message };
  }

  redirect(`/app/billing-runs/${data.id}`);
}

export async function lockBillingRun(formData: FormData) {
  const parsed = lockSchema.parse({ id: formData.get('id') });
  const supabase = createClient();

  const { data, error } = await supabase.rpc('lock_billing_run', {
    p_run_id: parsed.id
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app/dashboard');
  redirect(`/app/billing-runs/${data.id}`);
}

export async function toggleBillingRunPaid(formData: FormData) {
  const parsed = paidSchema.parse({
    id: formData.get('id'),
    is_paid: formData.get('is_paid') === 'true'
  });

  const supabase = createClient();
  const { data: run } = await supabase
    .from('billing_runs')
    .select('is_locked')
    .eq('id', parsed.id)
    .single();

  if (!run?.is_locked) {
    return { error: 'Only locked runs can be marked paid.' };
  }

  const { error } = await supabase
    .from('billing_runs')
    .update({
      is_paid: parsed.is_paid,
      paid_at: parsed.is_paid ? new Date().toISOString() : null
    })
    .eq('id', parsed.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app/dashboard');
  revalidatePath(`/app/billing-runs/${parsed.id}`);
}
