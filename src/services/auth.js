// Authentication backed by the finance API. Never persist passwords in browser storage.
const KEY = 'chuma_session_v1';
const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null') } catch { return null } };
export const getSession = () => read()?.user || null;
export const getAccessToken = () => read()?.tokens?.accessToken || null;
// Demo sessions use sample data instead of the database (see services/demo.js)
export const isDemo = () => Boolean(read()?.demo);
export const getRefreshToken = () => read()?.tokens?.refreshToken || null;
// Swap in renewed tokens and keep the rest of the session
export const updateTokens = (tokens) => { const s = read(); if (s) sessionStorage.setItem(KEY, JSON.stringify({ ...s, tokens: { ...s.tokens, ...tokens } })) };
export const startSession = (user, tokens, demo = false) => { sessionStorage.setItem(KEY, JSON.stringify({user, tokens, demo})); return user };
export const endSession = () => sessionStorage.removeItem(KEY);
export const getAccount = getSession;
export const saveAccount = () => { throw new Error('Accounts must be updated through the backend API') };
