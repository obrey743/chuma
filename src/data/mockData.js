// MOCK DATA — demo values only, not live financial data. Shapes follow the team API contract.
export const currency = 'ZMW'
export const money = (n) => `K${Number(n).toLocaleString()}`

export const user = { name: 'Mwila Banda', email: 'mwila@example.com', phone: '+260 97 000 0000' }

export const myCommunities = [
  { id: 'com_1', name: 'Chilenje Savings Group', member_count: 5, total_savings: 25000, loanable_funds: 15000,
    outstanding_loans: 6200, contribution: 500, frequency: 'Monthly', role: 'admin',
    members: ['Mwila B.', 'Natasha K.', 'Joseph M.', 'Chanda P.', 'Bupe L.'] },
  { id: 'com_2', name: 'Kabulonga Grocery Chilimba', member_count: 8, total_savings: 9600, loanable_funds: 4000,
    outstanding_loans: 1500, contribution: 150, frequency: 'Weekly', role: 'member',
    members: ['Mwila B.', 'Grace N.', 'Peter S.', 'Tamara Z.'] },
]

export const exploreCommunities = [
  { id: 'ex_1', name: 'Matero Market Women', member_count: 12, spots_left: 8, contribution: 100, frequency: 'Weekly' },
  { id: 'ex_2', name: 'Roma Young Professionals', member_count: 7, spots_left: 3, contribution: 800, frequency: 'Monthly' },
  { id: 'ex_3', name: 'Kitwe Farmers Pool', member_count: 15, spots_left: 5, contribution: 300, frequency: 'Monthly' },
  { id: 'ex_4', name: 'Fridge Chilimba', member_count: 6, spots_left: 4, contribution: 200, frequency: 'Weekly', product: 'a 200L fridge' },
  { id: 'ex_5', name: 'Monthly Groceries Club', member_count: 9, spots_left: 6, contribution: 120, frequency: 'Weekly', product: '5 bags of rice and cooking oil' },
]

// ---- Savings & Loans demo data ----
export const loanTerms = { interest_rate: 10, max_term_months: 3 }
export const savingsHistory = [
  { id: 1, date: '28 Oct', community: 'Chilenje Savings Group', amount: 500, method: 'MTN MoMo', status: 'CONFIRMED' },
  { id: 2, date: '21 Oct', community: 'Kabulonga Grocery Chilimba', amount: 150, method: 'Airtel Money', status: 'CONFIRMED' },
  { id: 3, date: '14 Oct', community: 'Kabulonga Grocery Chilimba', amount: 150, method: 'Airtel Money', status: 'CONFIRMED' },
  { id: 4, date: '28 Sep', community: 'Chilenje Savings Group', amount: 500, method: 'Card', status: 'CONFIRMED' },
]
export const monthly = [{ m: 'Jun', v: 650 }, { m: 'Jul', v: 800 }, { m: 'Aug', v: 650 }, { m: 'Sep', v: 950 }, { m: 'Oct', v: 1100 }]
export const myLoans = [
  { id: 'loan_1', community: 'Chilenje Savings Group', amount: 2000, interest: 10, term: 3, repaid: 1200, next_due: '5 Nov', status: 'ACTIVE' },
]
export const loanRequestsSeed = [
  { id: 'req_1', community: 'Kabulonga Grocery Chilimba', amount: 800, term: 2, purpose: 'School fees', date: '27 Oct', status: 'PENDING' },
]
export const catalogue = [
  { id: 'p1', name: 'Solar Home Kit', price: 3000, icon: 'sun', note: 'Lights and phone charging' },
  { id: 'p2', name: 'Smartphone', price: 2400, icon: 'phone', note: 'Mid-range Android' },
  { id: 'p3', name: '200L Fridge', price: 5200, icon: 'fridge', note: 'Energy saving' },
  { id: 'p4', name: 'Farming Equipment', price: 1800, icon: 'farm', note: 'Sprayer and hand tools' },
  { id: 'p5', name: 'Rice and Groceries', price: 1250, icon: 'basket', note: '5 bags of rice, oil, sugar' },
]

// ---- Personal savings demo data ----
export const personalSeed = [
  { id: 1, date: '30 Oct', type: 'DEPOSIT', amount: 200, note: 'Weekly savings' },
  { id: 2, date: '24 Oct', type: 'DEPOSIT', amount: 150, note: 'Side income' },
  { id: 3, date: '18 Oct', type: 'WITHDRAWAL', amount: 100, note: 'Transport' },
  { id: 4, date: '10 Oct', type: 'DEPOSIT', amount: 300, note: 'Salary top-up' },
]
export const personalMonthly = [{ m: 'Jun', v: 250 }, { m: 'Jul', v: 400 }, { m: 'Aug', v: 300 }, { m: 'Sep', v: 450 }, { m: 'Oct', v: 650 }]
