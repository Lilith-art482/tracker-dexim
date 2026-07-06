const STORAGE_KEY = "finance_hidden_modules";

export function getHiddenModules(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setHiddenModules(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function isModuleVisible(id: string): boolean {
  return !getHiddenModules().includes(id);
}
