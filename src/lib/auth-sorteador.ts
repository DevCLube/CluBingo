const KEY = "sorteador_auth_v1";
export const SORTEADOR_USER = "Clube";
export const SORTEADOR_PASS = "4922";

export function isSorteadorAuthed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}
export function signInSorteador(user: string, pass: string) {
  if (user.trim().toLowerCase() === SORTEADOR_USER.toLowerCase() && pass === SORTEADOR_PASS) {
    localStorage.setItem(KEY, "1");
    return true;
  }
  return false;
}
export function signOutSorteador() {
  localStorage.removeItem(KEY);
}
