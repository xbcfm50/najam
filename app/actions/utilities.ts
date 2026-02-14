'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const createUtilityTypeSchema = z.object({
  name: z.string().min(1).max(120),
  due_days_after_period_end: z.coerce.number().int().min(0).max(60),
  active: z.coerce.boolean().default(true)
});

const updateUtilityTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  due_days_after_period_end: z.coerce.number().int().min(0).max(60),
  active: z.coerce.boolean()
});

export async function createUtilityType(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const parsed = createUtilityTypeSchema.parse({
    name: formData.get('name'),
    due_days_after_period_end: formData.get('due_days_after_period_end'),
    active: formData.get('active') ?? true
  });

  const { error } = await supabase.from('utility_types').insert({ ...parsed, user_id: user.id });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app/settings/utilities');
  revalidatePath('/app/bills/new');
}

export async function updateUtilityType(formData: FormData) {
  const parsed = updateUtilityTypeSchema.parse({
    id: formData.get('id'),
    name: formData.get('name'),
    due_days_after_period_end: formData.get('due_days_after_period_end'),
    active: formData.get('active') === 'on'
  });

  const supabase = createClient();
  const { error } = await supabase
    .from('utility_types')
    .update({
      name: parsed.name,
      due_days_after_period_end: parsed.due_days_after_period_end,
      active: parsed.active
    })
    .eq('id', parsed.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app/settings/utilities');
  revalidatePath('/app/bills/new');
}
