import { getAccessToken, getSession, isDemo } from './auth'
import { demoRequest } from './demo'
// Same server as the frontend. In development Vite forwards /api to the backend (see vite.config.js).
const BASE = import.meta.env.VITE_API_URL || '/api/v1'
export async function finance(path, options = {}) {
  // Demo mode: sample data for everything except the AI, which still uses real Gemma
  if (isDemo() && !path.startsWith('/ai/')) return demoRequest(path, options, getSession())
  const headers = { ...(options.body && !(options.body instanceof FormData) ? {'Content-Type':'application/json'} : {}), ...options.headers }
  const token = getAccessToken(); if (token) headers.Authorization = `Bearer ${token}`
  let response
  try { response = await fetch(`${BASE}${path}`, {...options, headers}) }
  catch { throw new Error('Server is unavailable. Start it with npm run dev.') }
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(json?.error?.message || json?.message || `Request failed (${response.status})`)
  return json.data ?? json
}
export const demoLogin = () => finance('/auth/demo', { method: 'POST' })
export const registerAccount = async ({name,email,phone,password}) => {
  const bits = name.trim().split(/\s+/); const firstName = bits.shift(); const lastName = bits.join(' ') || '-'
  return finance('/auth/register', {method:'POST',body:JSON.stringify({firstName,lastName,email,phoneNumber:phone,password})})
}
export const loginAccount = ({email,password}) => finance('/auth/login',{method:'POST',body:JSON.stringify({email,password})})
export const updateAccount = (body) => finance('/auth/me',{method:'PATCH',body:JSON.stringify(body)})
export const listCommunities = () => finance('/communities')
export const createCommunity = (body) => finance('/communities',{method:'POST',body:JSON.stringify(body)})
export const communityDetails = (id) => finance(`/communities/${id}`)
export const communityDashboard = (id) => finance(`/communities/${id}/dashboard`)
export const communityMembers = (id) => finance(`/communities/${id}/members`)
export const contributionHistory = (id) => finance(`/communities/${id}/contributions`)
export const loanProducts = (id) => finance(`/communities/${id}/loan-products`)
export const loans = (id) => finance(`/communities/${id}/loans`)
export const requestLoan = (id,body) => finance(`/communities/${id}/loans`,{method:'POST',body:JSON.stringify(body)})
export const createContribution = (id,amount) => finance(`/communities/${id}/contributions`,{method:'POST',body:JSON.stringify({amount})})
export const confirmDemoContribution = (id,contributionId) => finance(`/communities/${id}/contributions/${contributionId}/mock-confirm`,{method:'POST'})
export const createCheckout = (id,amount,reference) => finance(`/communities/${id}/payments/checkout`,{method:'POST',body:JSON.stringify({amount,currency:'ZMW',idempotencyKey:reference})})
export const listProducts = (id) => finance(`/communities/${id}/products`)
