import Decimal from 'decimal.js';
export type Instalment = { instalmentNumber: number; principalDue: string; interestDue: string; totalDue: string };
const money = (v: Decimal.Value) => new Decimal(v).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
export function calculateLoan(principal: Decimal.Value, annualRate: Decimal.Value, months: number) {
  if (months <= 0 || !Number.isInteger(months)) throw new Error('Duration must be a positive whole number of months');
  const p = money(principal); const interest = money(p.mul(annualRate).mul(months).div(12)); const total = p.add(interest);
  const basePrincipal = money(p.div(months)); const baseInterest = money(interest.div(months));
  let allocatedP = new Decimal(0); let allocatedI = new Decimal(0); const schedule: Instalment[] = [];
  for (let i = 1; i <= months; i++) {
    const principalDue = i === months ? p.sub(allocatedP) : basePrincipal;
    const interestDue = i === months ? interest.sub(allocatedI) : baseInterest;
    allocatedP = allocatedP.add(principalDue); allocatedI = allocatedI.add(interestDue);
    schedule.push({ instalmentNumber: i, principalDue: principalDue.toFixed(2), interestDue: interestDue.toFixed(2), totalDue: principalDue.add(interestDue).toFixed(2) });
  }
  return { principal: p.toFixed(2), interest: interest.toFixed(2), totalPayable: total.toFixed(2), schedule };
}
