import Decimal from 'decimal.js';
import type { Prisma, PrismaClient } from '@prisma/client';
import { AppError } from '../../utils/errors.js';
export type PostingLine = { accountCode: string; side: 'DEBIT'|'CREDIT'; amount: Decimal.Value };
export function assertBalanced(lines: PostingLine[]) {
  const debit = lines.filter(x => x.side === 'DEBIT').reduce((n, x) => n.add(x.amount), new Decimal(0));
  const credit = lines.filter(x => x.side === 'CREDIT').reduce((n, x) => n.add(x.amount), new Decimal(0));
  if (!debit.eq(credit) || debit.lte(0)) throw new AppError(422, 'UNBALANCED_JOURNAL', 'Journal debits and credits must be equal and positive');
}
export async function postJournal(tx: Prisma.TransactionClient | PrismaClient, communityId: string, reference: string, description: string, lines: PostingLine[]) {
  assertBalanced(lines);
  const existing = await tx.journalEntry.findUnique({ where: { reference }, include: { lines: true } });
  if (existing) return existing;
  const accounts = await tx.ledgerAccount.findMany({ where: { communityId, code: { in: lines.map(x => x.accountCode) } } });
  if (accounts.length !== new Set(lines.map(x => x.accountCode)).size) throw new AppError(422, 'LEDGER_ACCOUNT_MISSING', 'A required ledger account is missing');
  return tx.journalEntry.create({ data: { communityId, reference, description, lines: { create: lines.map(line => ({ ledgerAccountId: accounts.find(a => a.code === line.accountCode)!.id, side: line.side, amount: new Decimal(line.amount).toFixed(2) })) } }, include: { lines: true } });
}
