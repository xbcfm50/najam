'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

async function ensureDefaultsIfAuthenticated() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.rpc('initialize_user_defaults');
}

export async function signIn(formData: FormData) {
  const parsed = authSchema.parse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed);

  if (error) {
    return { error: error.message };
  }

  await ensureDefaultsIfAuthenticated();
  redirect('/app/dashboard');
}

export async function signUp(formData: FormData) {
  const parsed = authSchema.parse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp(parsed);

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return { message: 'Account created. Please confirm your email and then sign in.' };
  }

  await ensureDefaultsIfAuthenticated();
  redirect('/app/dashboard');
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/app/login');
}
