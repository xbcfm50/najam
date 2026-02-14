import { signIn, signUp } from '../actions/auth';

export default function LoginPage() {
  return (
    <div className="mx-auto mt-20 max-w-md rounded border bg-white p-6">
      <h1 className="mb-4 text-xl font-semibold">Login</h1>
      <form className="space-y-3">
        <input className="w-full rounded border p-2" name="email" type="email" placeholder="Email" required />
        <input className="w-full rounded border p-2" name="password" type="password" placeholder="Password" required />
        <div className="grid grid-cols-2 gap-2">
          <button formAction={signIn} className="rounded bg-slate-900 p-2 text-white">Sign in</button>
          <button formAction={signUp} className="rounded border p-2">Sign up</button>
        </div>
      </form>
    </div>
  );
}
