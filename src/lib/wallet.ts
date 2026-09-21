import prisma from '@/lib/prisma'
import { TransactionType, TransactionStatus } from '@/generated/prisma/client'

/**
 * Credit an amount to a user's wallet atomically.
 * Creates both a WalletTransaction record and updates Wallet balances.
 */
export async function creditWallet(params: {
  userId: string
  amount: number
  type: TransactionType
  description: string
  reference?: string
  metadata?: Record<string, unknown>
}) {
  const { userId, amount, type, description, reference, metadata } = params

  return prisma.$transaction(async (tx) => {
    // Ensure wallet exists
    let wallet = await tx.wallet.findUnique({ where: { userId } })
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { userId },
      })
    }

    // Create transaction record
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        status: TransactionStatus.COMPLETED,
        amount,
        description,
        reference,
        metadata: metadata as object,
      },
    })

    // Update wallet balances
    const updateData: {
      availableBalance: { increment: number }
      totalEarned: { increment: number }
      videoEarnings?: { increment: number }
      referralEarnings?: { increment: number }
    } = {
      availableBalance: { increment: amount },
      totalEarned: { increment: amount },
    }

    if (type === TransactionType.VIDEO_REWARD) {
      updateData.videoEarnings = { increment: amount }
    }
    if (type === TransactionType.REFERRAL_REWARD) {
      updateData.referralEarnings = { increment: amount }
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: updateData,
    })

    return transaction
  })
}

/**
 * Debit an amount from a user's wallet (for withdrawals).
 */
export async function debitWallet(params: {
  userId: string
  amount: number
  description: string
  reference?: string
}) {
  const { userId, amount, description, reference } = params

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } })
    if (!wallet) throw new Error('Wallet not found')
    if (wallet.availableBalance < amount) throw new Error('Insufficient balance')

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.WITHDRAWAL_DEBIT,
        status: TransactionStatus.COMPLETED,
        amount: -amount,
        description,
        reference,
      },
    })

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { decrement: amount },
        pendingBalance: { increment: amount },
      },
    })

    return transaction
  })
}

/**
 * Finalize withdrawal — move from pending to withdrawn.
 */
export async function finalizeWithdrawal(userId: string, amount: number) {
  await prisma.wallet.update({
    where: { userId },
    data: {
      pendingBalance: { decrement: amount },
      totalWithdrawn: { increment: amount },
    },
  })
}

/**
 * Reverse a debit — move amount back from pending to available.
 */
export async function reverseWithdrawalDebit(userId: string, amount: number, reference: string) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } })
    if (!wallet) throw new Error('Wallet not found')

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.REVERSAL,
        status: TransactionStatus.COMPLETED,
        amount,
        description: 'Withdrawal reversed',
        reference,
      },
    })

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { increment: amount },
        pendingBalance: { decrement: amount },
      },
    })
  })
}
