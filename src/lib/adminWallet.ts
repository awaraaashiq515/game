import prisma from '@/lib/prisma'

/**
 * Get or create the single AdminWallet record.
 */
export async function getAdminWallet() {
  let wallet = await prisma.adminWallet.findFirst()
  if (!wallet) {
    wallet = await prisma.adminWallet.create({
      data: {
        totalFundsAdded: 0,
        totalDistributed: 0,
        totalWithdrawnByUsers: 0,
        availablePool: 0,
      },
    })
  }
  return wallet
}

/**
 * Admin adds funds manually to the master wallet pool.
 */
export async function adminAddFunds(amount: number, description = 'Manual fund addition') {
  const wallet = await getAdminWallet()

  const [updated] = await prisma.$transaction([
    prisma.adminWallet.update({
      where: { id: wallet.id },
      data: {
        totalFundsAdded: { increment: amount },
        availablePool: { increment: amount },
      },
    }),
    prisma.adminWalletTransaction.create({
      data: {
        type: 'FUND_ADD',
        amount,
        description,
      },
    }),
  ])

  return updated
}

/**
 * Called when a user earns a reward (video/referral).
 * Deducts from the admin pool and records it.
 */
export async function deductFromAdminPoolForReward(
  amount: number,
  description: string,
  reference?: string
) {
  const wallet = await getAdminWallet()

  await prisma.$transaction([
    prisma.adminWallet.update({
      where: { id: wallet.id },
      data: {
        totalDistributed: { increment: amount },
        availablePool: { decrement: amount },
      },
    }),
    prisma.adminWalletTransaction.create({
      data: {
        type: 'USER_REWARD',
        amount,
        description,
        reference,
      },
    }),
  ])
}

/**
 * Called when admin marks a withdrawal as PAID.
 * Records the finalized user withdrawal in admin ledger.
 */
export async function recordUserWithdrawalInAdminWallet(
  amount: number,
  reference: string,
  description: string
) {
  const wallet = await getAdminWallet()

  await prisma.$transaction([
    prisma.adminWallet.update({
      where: { id: wallet.id },
      data: {
        totalWithdrawnByUsers: { increment: amount },
      },
    }),
    prisma.adminWalletTransaction.create({
      data: {
        type: 'USER_WITHDRAWAL',
        amount,
        description,
        reference,
      },
    }),
  ])
}
