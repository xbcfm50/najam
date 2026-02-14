import './globals.css';
import Link from 'next/link';
import { signOut } from './actions/auth';
import { createClient } from '@/lib/supabase/server';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
            <Link href="/app/dashboard" className="font-semibold">Najam</Link>
            {user ? (
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/app/dashboard">Dashboard</Link>
                <Link href="/app/bills/new">New Bill</Link>
                <Link href="/app/settings/apartments">Apartments</Link>
                <Link href="/app/settings/utilities">Utilities</Link>
                <form action={signOut}><button className="rounded bg-slate-900 px-3 py-1 text-white">Sign out</button></form>
              </nav>
            ) : null}
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}
