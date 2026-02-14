'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

async function ensureDefaults() {
  const supabase = createClient();
  await supabase.rpc('initialize_user_defaults');
}

export async function signIn(formData: FormData) {
  const parsed = authSchema.parse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed);
  if (error) return { error: error.message };
  await ensureDefaults();
  redirect('/app/dashboard');
}

export async function signUp(formData: FormData) {
  const parsed = authSchema.parse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  const supabase = createClient();
  const { error } = await supabase.auth.signUp(parsed);
  if (error) return { error: error.message };
  await ensureDefaults();
  redirect('/app/dashboard');
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/app/login');
}
