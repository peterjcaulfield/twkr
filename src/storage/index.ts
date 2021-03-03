const STORAGE_KEY = "TWKR";

export const get = () => JSON.parse(localStorage.getItem(STORAGE_KEY));

export const set = (tokens: Record<string, any>) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));

export const clearStorage = () => localStorage.removeItem(STORAGE_KEY);
