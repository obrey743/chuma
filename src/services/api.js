import { myCommunities, exploreCommunities } from '../data/mockData'
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
// AI endpoints are live already, so they use the real backend unless VITE_USE_MOCK_AI=true
const USE_MOCK_AI = import.meta.env.VITE_USE_MOCK_AI === 'true'
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const wait = (d, ms = 250) => new Promise((r) => setTimeout(() => r(d), ms))

// Calls YOUR backend only. DevDraft/Gemma keys never live in the browser.
async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'Something went wrong')
  return json.data
}
const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) })

export const getMyCommunities = () => (USE_MOCK ? wait(myCommunities) : request('/api/communities/mine'))
export const getExplore = () => (USE_MOCK ? wait(exploreCommunities) : request('/api/communities/explore'))
export const getDashboard = (id) => request(`/api/communities/${id}/dashboard`)
export const checkout = (b) => (USE_MOCK ? wait({ transaction_id: `txn_${Date.now()}`, checkout_url: 'https://example.com/checkout', status: 'PENDING' }, 700) : post('/api/payments/checkout', b))
export const applyForLoan = (b) => (USE_MOCK ? wait({ id: `req_${Date.now()}`, status: 'PENDING' }, 600) : post('/api/loans', b))
export const savingsGoal = (b) => (USE_MOCK ? wait({ id: `goal_${Date.now()}`, ...b }) : post('/api/savings-goals', b))
export const recommendPlan = (b) => (USE_MOCK_AI ? wait(null) : post('/api/ai/recommend-plan', b))

// Backend returns name/category/specifications; the page uses product_name/product_category
const toProduct = (d) => ({
  product_name: d.name,
  product_category: d.category,
  description: d.description,
  specifications: d.specifications || [],
  detected_price: d.detected_price,
  is_mock: d.is_mock,
})

export async function analyzeProduct(file) {
  if (USE_MOCK_AI) return wait(toProduct({ name: 'Solar Home Kit', category: 'Electronics', description: 'Solar lighting system with a panel, battery and three bulbs', specifications: ['Solar panel', 'Battery', '3 bulbs'], detected_price: null, is_mock: true }), 1600)
  const fd = new FormData(); fd.append('image', file)
  let json
  try {
    const res = await fetch(`${BASE}/api/ai/analyze-product`, { method: 'POST', body: fd })
    json = await res.json()
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }
  if (!json.success) throw new Error(json.message || 'Could not analyse the image')
  return toProduct(json.data)
}
