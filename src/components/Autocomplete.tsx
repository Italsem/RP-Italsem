// src/components/Autocomplete.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet } from "../lib/api";

type Item = { codice: string; descrizione: string };

export default function Autocomplete(props: {
  type: "cantieri" | "mezzi" | "dipendenti";
  placeholder?: string;
  onSelect: (it: Item) => void;
}) {
  const { type, onSelect } = props;
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const fetchItems = useMemo(() => {
    let t: any = null;
    return (val: string) => {
      if (t) clearTimeout(t);
      t = setTimeout(async () => {
        const res = await apiGet<{ ok: true; items: Item[] }>(`/api/lists/${type}?q=${encodeURIComponent(val)}`);
        setItems(res.items || []);
      }, 200);
    };
  }, [type]);

  useEffect(() => {
    fetchItems(q);
  }, [q, fetchItems]);

  useEffect(() => {
    const onDoc = (e: any) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={boxRef}>
      <input
        className="w-full rounded-xl border px-3 py-2"
        placeholder={props.placeholder || "Cerca..."}
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
      />
      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border bg-white shadow">
          {items.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">Nessun risultato</div>
          ) : (
            items.map((it) => (
              <button
                key={it.codice}
                className="w-full px-3 py-2 text-left hover:bg-gray-100"
                onClick={() => {
                  onSelect(it);
                  setQ(`${it.codice} - ${it.descrizione}`);
                  setOpen(false);
                }}
              >
                <div className="font-medium">{it.codice}</div>
                <div className="text-sm text-gray-600">{it.descrizione}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
