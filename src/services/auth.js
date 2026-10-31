// DEMO AUTH (localStorage only). Replace with your backend's auth endpoints; never store real passwords in the browser.
const A = 'chuma_account', S = 'chuma_session'
export const getAccount = () => JSON.parse(localStorage.getItem(A) || 'null')
export const saveAccount = (a) => localStorage.setItem(A, JSON.stringify(a))
export const getSession = () => (localStorage.getItem(S) === '1' ? getAccount() : null)
export const startSession = () => localStorage.setItem(S, '1')
export const endSession = () => localStorage.removeItem(S)
