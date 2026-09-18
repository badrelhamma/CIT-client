const UNITS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq",
  "six", "sept", "huit", "neuf", "dix", "onze", "douze",
  "treize", "quatorze", "quinze", "seize",
];

const TENS: Record<number, string> = {
  10: "dix", 20: "vingt", 30: "trente", 40: "quarante",
  50: "cinquante", 60: "soixante", 80: "quatre-vingt",
};

export function countToWord(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (n < 0) return String(n);
  if (n <= 16) return UNITS[n];
  if (n === 20) return "vingt";
  if (n < 20) return `dix-${UNITS[n - 10]}`;
  if (n < 70 || (n >= 80 && n < 90)) {
    const ten = Math.floor(n / 10) * 10;
    const unit = n % 10;
    if (unit === 0) return TENS[ten];
    if (unit === 1) return `${TENS[ten]} et un`;
    return `${TENS[ten]}-${UNITS[unit]}`;
  }
  if (n < 80) {
    const rest = n - 60;
    return rest === 11 ? "soixante et onze" : `soixante-${UNITS[rest]}`;
  }
  const rest = n - 80;
  return rest === 10 ? "quatre-vingt-dix" : `quatre-vingt-${UNITS[rest]}`;
}

export function composeBilanType(
  template: string,
  vehicles: string[],
  count: number,
): string {
  let out = template;
  if (vehicles.length > 0) {
    out = out.split("?").join(vehicles.join(" + "));
  }
  out = out.split("nbr").join(countToWord(count));
  return out;
}