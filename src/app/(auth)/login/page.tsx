import Link from "next/link";
import { signIn } from "@/app/actions";
import { Banner } from "@/components/Banner";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const sp = await searchParams;
  return (
    <form action={signIn} className="flex flex-col gap-4">
      <Banner {...sp} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="btn">Log in</button>
      <p className="muted text-center">
        New here? <Link href="/signup" className="font-semibold text-brand">Create an account</Link>
      </p>
    </form>
  );
}
