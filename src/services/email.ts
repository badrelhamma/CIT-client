export const ADM_EMAIL_DOMAIN = "@adm.co.ma";

const ADM_EMAIL_PATTERN = /^[^\s@]+@adm\.co\.ma$/i;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isAdmEmail(value: string): boolean {
  return ADM_EMAIL_PATTERN.test(normalizeEmail(value));
}
