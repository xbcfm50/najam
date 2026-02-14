'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const createUtilityBillSchema = z.object({
  apartment_id: z.string().uuid(),
  utility_type_id: z.string().uuid(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  received_on: z.string(),
  amount_eur: z.coerce.number().min(0)
});

export async function createUtilityBill(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const parsed = createUtilityBillSchema.parse({
    apartment_id: formData.get('apartment_id'),
    utility_type_id: formData.get('utility_type_id'),
    period: formData.get('period'),
    received_on: formData.get('received_on'),
    amount_eur: formData.get('amount_eur')
  });
  const [year, month] = parsed.period.split('-').map(Number);

  const { error } = await supabase.from('utility_bills').insert({
    user_id: user.id,
    apartment_id: parsed.apartment_id,
    utility_type_id: parsed.utility_type_id,
    period_year: year,
    period_month: month,
    received_on: parsed.received_on,
    amount_eur: parsed.amount_eur.toFixed(2),
    status: 'RECEIVED',
    billing_run_id: null
  });
  if (error) return { error: error.message };
  redirect('/app/dashboard');
}
