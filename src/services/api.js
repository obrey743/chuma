import { isDemo } from './auth'
import { exploreCommunities } from '../data/mockData'
import { finance, listCommunities, communityDashboard, communityMembers, createContribution, confirmDemoContribution, createCheckout, requestLoan, loanProducts } from './finance'
const USE_MOCK_AI = import.meta.env.VITE_USE_MOCK_AI === 'true'
const mockWait = (data) => new Promise(resolve=>setTimeout(()=>resolve(data),300))
export const getMyCommunities = async () => {
  const groups=await listCommunities()
  return Promise.all(groups.map(async c=>{
    const [summary, memberRows] = await Promise.all([communityDashboard(c.id),communityMembers(c.id)])
    return { id:c.id,name:c.name,role:c.memberships?.[0]?.role?.toLowerCase()||'member',
      contribution:Number(c.minimumContribution||0), frequency:c.contributionFrequency||'FLEXIBLE',
      member_count:summary.totalMembers, members:memberRows.map(x=>`${x.user.firstName} ${x.user.lastName}`),
      loanable_funds:Number(summary.lendableFunds||0),total_savings:Number(summary.totalContributions||0),
      outstanding_loans:Number(summary.outstandingLoanPrincipal||0) }
  }))
}
// Join/discovery requires a future opt-in public-directory API. Demo mode shows sample groups.
export const getExplore = async () => (isDemo() ? mockWait(exploreCommunities) : [])
export const getDashboard = communityDashboard
export const checkout = async ({community_id,amount}) => {
  const contribution = await createContribution(community_id,amount)
  const demo = import.meta.env.VITE_DEMO_PAYMENTS === 'true'
  if (demo) {
    const record=await confirmDemoContribution(community_id,contribution.id)
    return {transaction_id:record.id,checkout_url:null,status:'CONFIRMED',simulated:true}
  }
  const payment=await createCheckout(community_id,amount,`contribution-${contribution.id}`)
  return {transaction_id:payment.transaction.id,checkout_url:payment.checkout?.checkoutUrl||null,status:payment.transaction.status||'PENDING',simulated:payment.transaction.isSimulated}
}
export const applyForLoan = async ({community_id,amount,term_months,purpose}) => {
  const products=await loanProducts(community_id)
  if(!products.length) throw new Error('This community has not configured any loan products yet. Ask an administrator to create one.')
  return requestLoan(community_id,{loanProductId:products[0].id,principal:amount,durationMonths:Number(term_months),purpose})
}
// The backend has no savings-goals endpoint yet, so AI Planner goals are kept on this device for now
export const savingsGoal = async (body) => mockWait({ id: `goal_${Date.now()}`, ...body, stored: 'local' })

// Gemma 4 endpoints live on the same backend (/api/v1/ai) and use the logged-in user's token
export const recommendPlan = (body) => (USE_MOCK_AI ? mockWait(null) : finance('/ai/recommend-plan', { method: 'POST', body: JSON.stringify(body) }))
export async function analyzeProduct(file) {
  const fd = new FormData(); fd.append('image', file)
  const d = await finance('/ai/analyze-product', { method: 'POST', body: fd })
  return { product_name: d.name, product_category: d.category, description: d.description, specifications: d.specifications || [], detected_price: d.detected_price, is_mock: d.is_mock }
}
