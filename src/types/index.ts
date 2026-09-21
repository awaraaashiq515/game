// Extend NextAuth session types
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
      image?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}

// ─── API Response Types ─────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  availableBalance: number
  todayEarnings: number
  videosWatchedToday: number
  dailyLimit: number
  referralEarnings: number
  totalEarned: number
}

// ─── Campaign ───────────────────────────────────────────────────────────────

export interface CampaignWithStatus {
  id: string
  name: string
  sponsor: string
  description: string | null
  thumbnailUrl: string | null
  videoUrl: string
  rewardAmount: number
  watchDuration: number
  status: 'ACTIVE' | 'PAUSED' | 'ENDED' | 'DRAFT' | 'ARCHIVED'
  userStatus: 'AVAILABLE' | 'COMPLETED_TODAY' | 'LOCKED' | 'EXPIRED'
  completedCount: number
  totalCompletions: number
}

// ─── Wallet ─────────────────────────────────────────────────────────────────

export interface WalletData {
  availableBalance: number
  pendingBalance: number
  totalEarned: number
  totalWithdrawn: number
  videoEarnings: number
  referralEarnings: number
}

export interface TransactionItem {
  id: string
  type: string
  status: string
  amount: number
  description: string
  reference: string | null
  createdAt: string
}

// ─── Referral ───────────────────────────────────────────────────────────────

export interface ReferralStats {
  referralCode: string
  referralLink: string
  totalReferrals: number
  qualifiedReferrals: number
  pendingReferrals: number
  totalEarnings: number
  referrals: ReferralItem[]
}

export interface ReferralItem {
  id: string
  name: string
  joinedAt: string
  status: string
  rewardAmount: number | null
  qualifiedAt: string | null
}

// ─── Withdrawal ─────────────────────────────────────────────────────────────

export interface WithdrawalHistoryItem {
  id: string
  requestId: string
  amount: number
  method: string
  status: string
  requestedAt: string
  processedAt: string | null
}

// ─── Leaderboard ────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number
  maskedName: string
  totalEarned: number
  isCurrentUser: boolean
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  todayVideoEarnings: number
  referralRewards: number
  pendingWithdrawals: number
  totalWithdrawn: number
  activeCampaigns: number
  totalFraudEvents: number
}
