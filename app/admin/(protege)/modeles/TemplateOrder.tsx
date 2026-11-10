"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import adminFr from "@/lib/i18n/admin-fr";

type Item = { id: string; name: string; screen: string };
type Group = { id: string; label: string; items: Item[] };

/** Listes à classer avec ↑ ↓ ; l'ordre complet (catégories mises bout à bout) est envoyé à /api/admin/modeles. */
export default function TemplateOrder({ groups: initial }: { groups: Group[] }) {
  const copy = { moveUp: adminFr.moveUp, moveDown: adminFr.moveDown, save: adminFr.saveOrder, reset: adminFr.resetOrder, saved: adminFr.orderSaved, unchanged: adminFr.orderUnchanged, failed: adminFr.actionFailed, first: adminFr.firstShown };
  const router = useRouter();
  const [groups, setGroups] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const flat = (gs: Group[]) => gs.flatMap((g) => g.items.map((i) => i.id));
  const dirty = flat(groups).join() !== flat(initial).join();

  function move(gi: number, i: number, step: number) {
    setMsg(null);
    setGroups((gs) => gs.map((g, k) => {
      if (k !== gi) return g;
      const items = [...g.items];
      const j = i + step;
      if (j < 0 || j >= items.length) return g;
      [items[i], items[j]] = [items[j], items[i]];
      return { ...g, items };
    }));
  }

  async function save() {
    if (!dirty) { setMsg({ ok: true, text: copy.unchanged }); return; }
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/modeles", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ order: flat(groups) }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || copy.failed);
      setMsg({ ok: true, text: copy.saved });
      router.refresh();
    } catch (cause) {
      setMsg({ ok: false, text: cause instanceof Error ? cause.message : copy.failed });
    } finally { setBusy(false); }
  }

  return <div className="ad-tpl">
    <div className="ad-tpl-groups">
      {groups.map((g, gi) => <section key={g.id} className="ad-panel ad-tpl-group">
        <h2>{g.label}</h2>
        <ol>
          {g.items.map((item, i) => <li key={item.id}>
            <span className="ad-tpl-rank">{i + 1}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.screen} alt="" width={36} height={72} loading="lazy" />
            <span className="ad-tpl-name">{item.name}{i === 0 && <small>{copy.first}</small>}</span>
            <span className="ad-tpl-moves">
              <button type="button" disabled={busy || i === 0} aria-label={copy.moveUp(item.name)} onClick={() => move(gi, i, -1)}>↑</button>
              <button type="button" disabled={busy || i === g.items.length - 1} aria-label={copy.moveDown(item.name)} onClick={() => move(gi, i, 1)}>↓</button>
            </span>
          </li>)}
        </ol>
      </section>)}
    </div>
    <div className="ad-tpl-bar">
      <button type="button" className="ad-tpl-save" disabled={busy || !dirty} onClick={() => void save()}>{copy.save}</button>
      {dirty && <button type="button" className="ad-tpl-reset" disabled={busy} onClick={() => { setGroups(initial); setMsg(null); }}>{copy.reset}</button>}
      {msg && <small role={msg.ok ? "status" : "alert"} className={msg.ok ? "ok" : "err"}>{msg.text}</small>}
    </div>
  </div>;
}
