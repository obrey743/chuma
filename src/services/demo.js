// Demo mode: answers the finance API calls in the browser with sample data, so the app works without a database.
// Responses use the same shapes as the real backend, so the pages don't need to know the difference.
// Nothing here is real money. Changes are kept for this browser tab only.
import { myCommunities, savingsHistory, myLoans, loanRequestsSeed } from '../data/mockData'

const KEY = 'chuma_demo_db_v1'
const now = () => new Date().toISOString()
const id = (p) => `${p}_${Math.random().toString(36).slice(2, 10)}`
const daysAgo = (d) => new Date(Date.now() - d * 864e5).toISOString()

function seed() {
  const db = { communities: [], dashboard: {}, members: {}, contributions: {}, loans: {}, user: null }
  for (const c of myCommunities) {
    db.communities.push({ id: c.id, name: c.name, currency: 'ZMW', minimumContribution: String(c.contribution), contributionFrequency: c.frequency.toUpperCase(), memberships: [{ role: c.role.toUpperCase() }] })
    db.dashboard[c.id] = { totalMembers: c.member_count, lendableFunds: String(c.loanable_funds), totalContributions: String(c.total_savings), outstandingLoanPrincipal: String(c.outstanding_loans) }
    db.members[c.id] = c.members.map((n) => { const [firstName, ...rest] = n.split(' '); return { user: { firstName, lastName: rest.join(' ') } } })
    db.contributions[c.id] = savingsHistory.filter((h) => h.community === c.name).map((h, i) => ({ id: `con_${c.id}_${h.id}`, amount: String(h.amount), status: h.status, createdAt: daysAgo(3 + i * 7) }))
    db.loans[c.id] = [
      ...myLoans.filter((l) => l.community === c.name).map((l) => ({ id: l.id, principal: String(l.amount), annualInterestRate: String(l.interest / 100), durationMonths: l.term, status: l.status, purpose: 'Business stock', createdAt: daysAgo(40), repayments: [{ amount: String(l.repaid) }], schedule: [{ dueDate: new Date(Date.now() + 5 * 864e5).toISOString() }] })),
      ...loanRequestsSeed.filter((l) => l.community === c.name).map((l) => ({ id: l.id, principal: String(l.amount), annualInterestRate: '0.10', durationMonths: l.term, status: l.status, purpose: l.purpose, createdAt: daysAgo(4), repayments: [], schedule: [] })),
    ]
  }
  return db
}

const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || seed() } catch { return seed() } }
const save = (db) => { try { sessionStorage.setItem(KEY, JSON.stringify(db)) } catch { /* private mode: keep in memory only */ } }
export const resetDemo = () => { try { sessionStorage.removeItem(KEY) } catch { /* ignore */ } }

const fail = (message) => { throw new Error(message) }
const wait = (data) => new Promise((r) => setTimeout(() => r(data), 250))

export async function demoRequest(path, options = {}, sessionUser) {
  const method = (options.method || 'GET').toUpperCase()
  const body = typeof options.body === 'string' ? JSON.parse(options.body) : {}
  const db = load()
  const [, , cid, sub, subId, action] = path.split('/') // "/communities/:cid/:sub/:subId/:action"
  const community = cid && db.communities.find((c) => c.id === cid)
  if (cid && path.startsWith('/communities/') && !community) fail('Community not found')
  let result

  if (path === '/communities' && method === 'GET') result = db.communities
  else if (path === '/communities' && method === 'POST') {
    const c = { id: id('com'), name: body.name, currency: 'ZMW', minimumContribution: String(body.minimumContribution), contributionFrequency: body.contributionFrequency, memberships: [{ role: 'ADMIN' }] }
    db.communities.push(c)
    db.dashboard[c.id] = { totalMembers: 1, lendableFunds: '0', totalContributions: '0', outstandingLoanPrincipal: '0' }
    const [firstName, ...rest] = (sessionUser?.name || 'Demo User').split(' ')
    db.members[c.id] = [{ user: { firstName, lastName: rest.join(' ') } }]
    db.contributions[c.id] = []; db.loans[c.id] = []
    result = c
  }
  else if (community && !sub && method === 'GET') result = community
  else if (community && sub === 'dashboard') result = db.dashboard[cid]
  else if (community && sub === 'members') result = db.members[cid]
  else if (community && sub === 'products') result = []
  else if (community && sub === 'loan-products') result = [{ id: `lp_${cid}`, name: 'Standard loan', annualInterestRate: '0.10', minAmount: '100', maxAmount: db.dashboard[cid].lendableFunds, minMonths: 1, maxMonths: 3 }]
  else if (community && sub === 'contributions' && !subId && method === 'GET') result = [...db.contributions[cid]].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  else if (community && sub === 'contributions' && !subId && method === 'POST') {
    const row = { id: id('con'), amount: Number(body.amount).toFixed(2), status: 'PENDING', createdAt: now() }
    db.contributions[cid].push(row); result = row
  }
  else if (community && sub === 'contributions' && action === 'mock-confirm') result = confirm(db, cid, subId)
  else if (community && sub === 'payments' && subId === 'checkout') {
    // Demo payments succeed straight away. No real money moves.
    const contributionId = String(body.idempotencyKey || '').replace(/^contribution-/, '')
    const row = confirm(db, cid, contributionId)
    result = { transaction: { id: id('txn'), status: 'CONFIRMED', isSimulated: true, contributionId: row.id }, checkout: null }
  }
  else if (community && sub === 'loans' && method === 'GET') result = db.loans[cid]
  else if (community && sub === 'loans' && method === 'POST') {
    const principal = Number(body.principal)
    if (!(principal > 0)) fail('Enter a loan amount above K0')
    if (principal > Number(db.dashboard[cid].lendableFunds)) fail(`This community can only lend up to K${Number(db.dashboard[cid].lendableFunds).toLocaleString()} right now`)
    const loan = { id: id('loan'), principal: principal.toFixed(2), annualInterestRate: '0.10', durationMonths: Number(body.durationMonths), status: 'PENDING', purpose: body.purpose || '', createdAt: now(), repayments: [], schedule: [] }
    db.loans[cid].push(loan); result = loan
  }
  else if (path === '/auth/me' && method === 'PATCH') {
    db.user = { id: sessionUser?.id || 'demo', email: sessionUser?.email || 'demo@chuma.app', firstName: body.firstName, lastName: body.lastName, phoneNumber: body.phoneNumber }
    result = db.user
  }
  else fail('This action is not available in demo mode')

  save(db)
  return wait(result)
}

function confirm(db, cid, contributionId) {
  const row = db.contributions[cid].find((x) => x.id === contributionId) || fail('Contribution not found')
  if (row.status !== 'CONFIRMED') {
    row.status = 'CONFIRMED'
    const d = db.dashboard[cid]
    d.totalContributions = String(Number(d.totalContributions) + Number(row.amount))
    d.lendableFunds = String(Number(d.lendableFunds) + Number(row.amount))
  }
  return row
}
