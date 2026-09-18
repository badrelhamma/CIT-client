export function normalize(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function metierKey(v: string): string {
  return normalize(v).replace(/,$/, "");
}

export const selectCls =
  "w-full cursor-pointer appearance-none rounded-lg border border-line bg-card px-4 py-3 text-base text-ink shadow-sm transition-colors hover:border-adm-300 focus:border-adm-500 focus:outline-none";

export const inputCls =
  "w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-base text-ink shadow-sm transition-colors focus:border-adm-500 focus:outline-none";