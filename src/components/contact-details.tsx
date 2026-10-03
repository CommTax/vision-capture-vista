import { Link } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { saveContact } from "@/lib/entitlements";
import { getState } from "@/lib/store";

export const COUNTRY_CODES = [
  ["+91", "India"], ["+1", "US / Canada"], ["+44", "UK"], ["+971", "UAE"], ["+65", "Singapore"], ["+61", "Australia"],
  ["+49", "Germany"], ["+33", "France"], ["+966", "Saudi Arabia"], ["+974", "Qatar"], ["+60", "Malaysia"], ["+94", "Sri Lanka"],
  ["+977", "Nepal"], ["+880", "Bangladesh"], ["+81", "Japan"], ["+353", "Ireland"], ["+31", "Netherlands"], ["+64", "New Zealand"],
] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE = /^\+\d{1,4}$/;
/** Lenient: digits with optional spaces, dashes, dots or brackets; 5–15 digits total (E.164 ceiling). */
export function phoneError(code: string, phone: string) {
  if (!CODE.test(code.trim())) return "Choose a valid country code.";
  if (!phone.trim()) return "Please enter your phone number.";
  if (!/^[\d\s().-]+$/.test(phone.trim())) return "Use digits only (spaces and dashes are fine).";
  const digits = phone.replace(/\D/g, "").length + code.replace(/\D/g, "").length;
  if (digits < 6 || digits > 15) return "That phone number doesn't look complete.";
  return "";
}

/** Name / email / phone form. Pre-fills from the profile so details are never asked twice. */
export function ContactDetails({ eyebrow, title, body, submit, consent, onDone, onCancel, footer }: {
  eyebrow?: string; title: string; body?: string; submit: string; consent?: boolean; onDone: () => void; onCancel?: () => void; footer?: ReactNode;
}) {
  const p = getState().profile;
  const [f, setF] = useState({ name: p?.name && p.name !== "Friend" ? p.name : "", email: p?.email ?? "", code: p?.phone_country_code ?? "+91", phone: p?.phone ?? "" });
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const go = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.name.trim()) er.name = "Please enter your name.";
    if (!EMAIL.test(f.email.trim())) er.email = "Please enter a valid email.";
    const pe = phoneError(f.code, f.phone); if (pe) er.phone = pe;
    setErr(er);
    if (Object.keys(er).length) return;
    saveContact({ name: f.name.trim(), email: f.email.trim(), phone_country_code: f.code.trim(), phone: f.phone.trim() }, consent ? ok : undefined);
    onDone();
  };
  const msg = (k: string) => err[k] && <p className="mt-1 text-[12px] text-destructive">{err[k]}</p>;
  return (
    <form onSubmit={go} noValidate className="glass glass-float rise mx-auto max-w-lg space-y-4 p-6 md:p-8">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2 className="text-[24px] font-bold leading-tight">{title}</h2>
      {body && <p className="text-[14px] text-muted-foreground">{body}</p>}
      <div><input className="field" placeholder="Name" aria-label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />{msg("name")}</div>
      <div><input className="field" type="email" placeholder="Email" aria-label="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />{msg("email")}</div>
      <div>
        <div className="grid grid-cols-[minmax(0,120px)_minmax(0,1fr)] gap-2">
          <select className="field" aria-label="Country code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })}>
            {COUNTRY_CODES.map(([c, n]) => <option key={c + n} value={c}>{c} {n}</option>)}
          </select>
          <input className="field" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="Phone number" aria-label="Phone number" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </div>
        {msg("phone")}
      </div>
      {consent && (
        <label className="flex cursor-pointer items-start gap-2 text-[13px] text-muted-foreground">
          <input type="checkbox" className="mt-0.5" checked={ok} onChange={(e) => setOk(e.target.checked)} />
          Send me Unspoken tips, product updates, and offers by email.
        </label>
      )}
      <button className="btn btn-primary w-full">{submit}</button>
      {onCancel && <button type="button" className="btn btn-ghost w-full" onClick={onCancel}>Back</button>}
      {footer ?? <p className="text-center text-[12px] text-muted-foreground">By continuing you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>}
    </form>
  );
}
