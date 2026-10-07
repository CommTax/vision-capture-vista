import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Role = { slug: string; name: string };

const API_BASE =
  import.meta.env.VITE_API_URL ??
  "https://unspoken-backend-nqvl.onrender.com";

export function RoleSelectorCard({
  selected,
  isPaid,
  onChange,
}: {
  selected: string | null;
  isPaid: boolean;
  onChange: (roleName: string) => void;
}) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/questions/roles`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setRoles(data.roles ?? []);
      })
      .catch((err) => console.warn("[role-selector] failed:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="glass p-5 text-[13px] text-muted-foreground">
        Loading roles…
      </div>
    );
  }

  return (
    <div className="glass p-5">
      <div className="eyebrow mb-3 !text-primary">Pick your role</div>
      <p className="mb-4 text-[13px] text-muted-foreground">
        We'll show interview questions tailored to the role you're preparing for.
      </p>

      <div className="flex flex-wrap gap-2">
        {roles.map((r) => (
          <button
            key={r.slug}
            type="button"
            onClick={() => onChange(r.name)}
            className={`chip ${
              selected === r.name ? "border-primary/60 bg-primary/10" : ""
            }`}
          >
            {selected === r.name && <Check className="mr-1 size-3" />}
            {r.name}
          </button>
        ))}

        {isPaid ? (
          <button
            type="button"
            onClick={() => onChange("__custom__")}
            className={`chip ${
              selected === "__custom__" ? "border-primary/60 bg-primary/10" : ""
            }`}
          >
            Custom role
          </button>
        ) : (
          <Link
            to="/plans"
            className="chip flex items-center gap-1 opacity-70"
            title="Custom role is available on paid plans"
          >
            <Lock className="size-3" />
            Custom role
          </Link>
        )}
      </div>

      {isPaid && selected === "__custom__" && (
        <div className="mt-4">
          <input
            type="text"
            placeholder="Type your custom role (e.g. Growth Marketer)"
            className="field w-full"
            maxLength={60}
            onChange={(e) => onChange(e.target.value.trim() || "__custom__")}
          />
        </div>
      )}
    </div>
  );
}
