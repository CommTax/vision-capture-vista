// Share rewards panel. Renders nothing until the share_rewards switch is turned on in the backend.
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { claimShareReward, getGrowthSettings, getMyRewards, type ShareRewardsConfig } from "@/lib/growth.functions";

type Mine = { code: string; rewards: { kind: string; status: string; discount_code: string | null; discount_pct: number | null }[]; friends: number };
export type ShareSetup = { config: ShareRewardsConfig | null; mine: Mine | null; refresh: () => void };

export function useShareSetup(): ShareSetup {
  const settings = useServerFn(getGrowthSettings);
  const rewards = useServerFn(getMyRewards);
  const [config, setConfig] = useState<ShareRewardsConfig | null>(null);
  const [mine, setMine] = useState<Mine | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let off = false;
    void (async () => {
      const s = await settings().catch(() => null);
      if (off || !s) return;
      setConfig(s.shareRewards);
      if (!s.shareRewards.enabled) return;
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      const m = await rewards().catch(() => null);
      if (!off && m) setMine(m);
    })();
    return () => { off = true; };
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  return { config, mine, refresh: () => setTick((t) => t + 1) };
}

export function ShareRewards({ setup, inviteUrl }: { setup: ShareSetup; inviteUrl?: string }) {
  const { config, mine } = setup;
  const claim = useServerFn(claimShareReward);
  const [ig, setIg] = useState("");
  const [post, setPost] = useState("");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);
  if (!config?.enabled) return null;
  const handle = config.instagram_handle || "us";
  const status = (k: string) => mine?.rewards.find((r) => r.kind === k);

  async function submit(kind: "tag" | "follow") {
    setBusy(kind);
    try { await claim({ data: { kind, instagram_handle: ig, ...(kind === "tag" && post ? { post_url: post } : {}) } }); setup.refresh(); }
    finally { setBusy(""); }
  }
  const Row = ({ kind, title, pct, body }: { kind: "tag" | "follow"; title: string; pct: number; body: string }) => {
    const r = status(kind);
    return (
      <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4 text-left">
        <div><p className="font-semibold">{title}{pct ? ` · ${pct}% off` : ""}</p><p className="text-[13px] text-muted-foreground">{body}</p></div>
        {r ? <span className="shrink-0 text-[13px] text-muted-foreground">{r.discount_code ? `Code: ${r.discount_code}` : r.status === "pending" ? "Checking" : r.status}</span>
          : <button className="btn btn-ghost btn-sm shrink-0" disabled={!ig.trim() || !mine || busy === kind} onClick={() => submit(kind)}>Claim</button>}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[520px] space-y-3 text-left">
      <p className="font-display text-[18px] font-semibold">Share and save</p>
      {!mine ? <p className="text-[14px] text-muted-foreground">Sign in to collect your discount codes.</p> : <>
        <input className="field" placeholder="Your Instagram username" value={ig} onChange={(e) => setIg(e.target.value)} />
        <input className="field" placeholder="Link to your post (for tagging)" value={post} onChange={(e) => setPost(e.target.value)} />
        <Row kind="tag" title={`Tag ${handle}`} pct={config.tag_discount_pct} body="Post your card and tag us. We'll send your code on Instagram." />
        <Row kind="follow" title={`Follow ${handle}`} pct={config.follow_discount_pct} body="Follow us and we'll send one more code." />
        <div className="rounded-xl border border-border p-4">
          <p className="font-semibold">Invite friends{config.friend_discount_pct ? ` · they get ${config.friend_discount_pct}% off` : ""}</p>
          <p className="text-[13px] text-muted-foreground">Your code <b>{mine.code}</b>{config.referrer_discount_pct ? ` · you get ${config.referrer_discount_pct}% for each friend who joins` : ""}. Friends joined: {mine.friends}</p>
          {inviteUrl && <button className="btn btn-ghost btn-sm mt-2" onClick={() => { void navigator.clipboard?.writeText(inviteUrl); setCopied(true); }}>{copied ? "Copied" : "Copy invite link"}</button>}
        </div>
      </>}
    </div>
  );
}
