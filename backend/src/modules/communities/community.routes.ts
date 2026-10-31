import { Router } from 'express';
import crypto from 'node:crypto';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { requireMembership } from '../../middleware/community.js';
import { requirePrisma } from '../../config/prisma.js';
import { AppError, asyncHandler } from '../../utils/errors.js';

export const communityRouter = Router(); communityRouter.use(authenticate);
const createSchema = z.object({ name: z.string().min(2).max(120), description: z.string().max(1000).optional(), currency: z.string().length(3).default('ZMW'), minimumContribution: z.coerce.string().refine(v => new Decimal(v).gt(0)), contributionFrequency: z.enum(['WEEKLY','MONTHLY','FLEXIBLE']), defaultLoanInterestRate: z.coerce.string().refine(v => new Decimal(v).gte(0) && new Decimal(v).lte(1)) });
communityRouter.post('/', asyncHandler(async (req, res) => {
  const input = createSchema.parse(req.body); const code = `${input.name.replace(/[^A-Za-z]/g, '').slice(0,4).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const community = await requirePrisma().$transaction(async tx => {
    const c = await tx.community.create({ data: { ...input, communityCode: code, createdById: req.user!.id, memberships: { create: { userId: req.user!.id, role: 'ADMIN' } } } });
    await tx.ledgerAccount.createMany({ data: [
      { communityId: c.id, code: 'CASH', name: 'Community cash', type: 'ASSET' }, { communityId: c.id, code: 'LOANS_RECEIVABLE', name: 'Loans receivable', type: 'ASSET' },
      { communityId: c.id, code: 'MEMBER_SAVINGS', name: 'Member savings', type: 'LIABILITY' }, { communityId: c.id, code: 'PRODUCT_SAVINGS', name: 'Restricted product savings', type: 'LIABILITY', isRestricted: true },
      { communityId: c.id, code: 'INTEREST_INCOME', name: 'Interest income', type: 'INCOME' }, { communityId: c.id, code: 'PURCHASE_EXPENSE', name: 'Product purchases', type: 'EXPENSE' }
    ] }); return c;
  }); res.status(201).json({ data: community });
}));
communityRouter.get('/', asyncHandler(async (req, res) => { const rows = await requirePrisma().community.findMany({ where: { memberships: { some: { userId: req.user!.id, status: 'ACTIVE' } } }, include: { memberships: { where: { userId: req.user!.id }, select: { role: true, status: true } } } }); res.json({ data: rows }); }));
communityRouter.get('/:id', requireMembership(), asyncHandler(async (req, res) => { const row = await requirePrisma().community.findUnique({ where: { id: req.params.id } }); if (!row) throw new AppError(404,'COMMUNITY_NOT_FOUND','Community not found'); res.json({ data: row }); }));
communityRouter.patch('/:id', requireMembership('ADMIN'), asyncHandler(async (req, res) => { const input = createSchema.partial().omit({ currency: true }).parse(req.body); res.json({ data: await requirePrisma().community.update({ where: { id: req.params.id }, data: input }) }); }));
communityRouter.get('/:id/members', requireMembership(), asyncHandler(async (req, res) => { res.json({ data: await requirePrisma().communityMembership.findMany({ where: { communityId: req.params.id }, include: { user: { select: { id:true, firstName:true, lastName:true, email:true, phoneNumber:true } } } }) }); }));
communityRouter.post('/:id/members', requireMembership('ADMIN'), asyncHandler(async (req, res) => { const input = z.object({ email: z.email(), role: z.enum(['ADMIN','TREASURER','MEMBER']).default('MEMBER') }).parse(req.body); const user = await requirePrisma().user.findUnique({ where: { email: input.email.toLowerCase() } }); if (!user) throw new AppError(404,'USER_NOT_FOUND','Registered user not found'); const member = await requirePrisma().communityMembership.upsert({ where: { communityId_userId: { communityId:req.params.id,userId:user.id } }, update: { status:'ACTIVE',role:input.role }, create: { communityId:req.params.id,userId:user.id,role:input.role } }); res.status(201).json({ data:member }); }));
communityRouter.patch('/:id/members/:memberId', requireMembership('ADMIN'), asyncHandler(async (req,res)=>{ const input=z.object({role:z.enum(['ADMIN','TREASURER','MEMBER'])}).parse(req.body); const member=await requirePrisma().communityMembership.findFirst({where:{id:req.params.memberId,communityId:req.params.id}}); if(!member) throw new AppError(404,'MEMBER_NOT_FOUND','Member not found in this community'); res.json({data:await requirePrisma().communityMembership.update({where:{id:member.id},data:input})}); }));
communityRouter.get('/:id/dashboard', requireMembership(), asyncHandler(async (req, res) => {
  const db=requirePrisma(), id=req.params.id; const [community,members,contributions,loans,products,goals,recent]=await Promise.all([
    db.community.findUnique({where:{id}}), db.communityMembership.count({where:{communityId:id,status:'ACTIVE'}}), db.contribution.aggregate({where:{communityId:id,status:'CONFIRMED'},_sum:{amount:true}}),
    db.loan.findMany({where:{communityId:id},select:{status:true,principal:true,totalPayable:true,repayments:{select:{principalAmount:true,interestAmount:true}}}}), db.product.count({where:{communityId:id,status:'ACTIVE'}}), db.savingsGoal.count({where:{communityId:id,status:'ACTIVE'}}), db.journalEntry.findMany({where:{communityId:id},orderBy:{postedAt:'desc'},take:10})]);
  const cashLines=await db.journalLine.findMany({where:{entry:{communityId:id,status:'POSTED'},account:{code:'CASH'}},select:{side:true,amount:true}}); const cash=cashLines.reduce((n,l)=>l.side==='DEBIT'?n.add(l.amount.toString()):n.sub(l.amount.toString()),new Decimal(0));
  const outstanding=loans.reduce((n,l)=>n.add(l.principal.toString()).sub(l.repayments.reduce((x,r)=>x.add(r.principalAmount.toString()),new Decimal(0))),new Decimal(0)); const commitments=loans.filter(l=>l.status==='APPROVED').reduce((n,l)=>n.add(l.principal.toString()),new Decimal(0));
  const restrictedLines=await db.journalLine.findMany({where:{entry:{communityId:id,status:'POSTED'},account:{code:'PRODUCT_SAVINGS'}},select:{side:true,amount:true}}); const restricted=restrictedLines.reduce((n,l)=>l.side==='CREDIT'?n.add(l.amount.toString()):n.sub(l.amount.toString()),new Decimal(0));
  res.json({data:{community,totalMembers:members,totalContributions:(contributions._sum.amount??0).toString(),cashAvailable:cash.toFixed(2),outstandingLoanPrincipal:outstanding.toFixed(2),restrictedProductSavings:restricted.toFixed(2),loanCommitments:commitments.toFixed(2),lendableFunds:Decimal.max(0,cash.sub(restricted).sub(commitments)).toFixed(2),activeLoans:loans.filter(l=>['ACTIVE','DISBURSED'].includes(l.status)).length,pendingLoanApplications:loans.filter(l=>l.status==='PENDING').length,products,activeSavingsGoals:goals,recentActivities:recent}});
}));
