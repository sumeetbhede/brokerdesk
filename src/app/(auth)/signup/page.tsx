import Link from "next/link";
import { signUp } from "@/app/actions";
import { Banner } from "@/components/Banner";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const sp = await searchParams;
  return (
    <form action={signUp} className="flex flex-col gap-4">
      <Banner {...sp} />
      <div>
        <label className="label" htmlFor="full_name">Your name</label>
        <input className="input" id="full_name" name="full_name" autoComplete="name" required />
      </div>
      <div>
        <label className="label" htmlFor="phone">WhatsApp number</label>
        <input className="input" id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" required />
        <p className="muted mt-1 text-xs">Clients see this on the properties you share.</p>
      </div>
      <div>
        <label className="label" htmlFor="business_name">Business name (optional)</label>
        <input className="input" id="business_name" name="business_name" placeholder="Sharma Properties" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <button className="btn">Create account</button>
      <p className="muted text-center">
        Already have an account? <Link href="/login" className="font-semibold text-accent">Log in</Link>
      </p>
    </form>
  );
}
