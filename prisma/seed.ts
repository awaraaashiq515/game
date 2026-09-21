import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })



async function main() {
  console.log('🌱 Seeding database...')

  // ─── System Config ─────────────────────────────────────────────
  const configs = [
    { key: 'video_reward_amount', value: '20', label: 'Reward per video (₹)', group: 'earning' },
    { key: 'daily_video_limit', value: '10', label: 'Daily video limit per user', group: 'earning' },
    { key: 'min_watch_duration', value: '30', label: 'Minimum watch duration (seconds)', group: 'earning' },
    { key: 'referral_reward_amount', value: '200', label: 'Referral reward (₹)', group: 'referral' },
    { key: 'referral_qualification', value: 'FIRST_VIDEO', label: 'Referral qualification trigger', group: 'referral' },
    { key: 'min_withdrawal', value: '2000', label: 'Minimum withdrawal (₹)', group: 'withdrawal' },
    { key: 'withdrawal_processing_days', value: '3', label: 'Withdrawal processing days', group: 'withdrawal' },
    { key: 'max_daily_earning', value: '200', label: 'Max daily earning per user (₹)', group: 'earning' },
  ]

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    })
  }
  console.log('✅ System configs seeded')

  // ─── Admin User ─────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('admin123', 12)
  await prisma.adminUser.upsert({
    where: { email: 'admin@virelo.com' },
    update: {},
    create: {
      email: 'admin@virelo.com',
      name: 'Virelo Admin',
      passwordHash: adminPasswordHash,
    },
  })
  console.log('✅ Admin user seeded (admin@virelo.com / admin123)')

  // ─── Demo Campaigns ─────────────────────────────────────────────
  const campaigns = [
    {
      name: 'Tech Product Launch',
      sponsor: 'TechCorp India',
      description: 'Watch our latest product launch video and earn rewards.',
      thumbnailUrl: null,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      rewardAmount: 20,
      watchDuration: 30,
      dailyLimit: 10,
      totalBudget: 10000,
      status: 'ACTIVE' as const,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Finance App Promotion',
      sponsor: 'FinanceApp Pro',
      description: 'Learn about smart investing with this sponsored video.',
      thumbnailUrl: null,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      rewardAmount: 20,
      watchDuration: 45,
      dailyLimit: 10,
      totalBudget: 15000,
      status: 'ACTIVE' as const,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'E-commerce Brand Awareness',
      sponsor: 'ShopNow.in',
      description: 'Discover exclusive deals from ShopNow this season.',
      thumbnailUrl: null,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      rewardAmount: 20,
      watchDuration: 30,
      dailyLimit: 10,
      totalBudget: 8000,
      status: 'ACTIVE' as const,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Health & Wellness Campaign',
      sponsor: 'WellnessPlus',
      description: 'Promoting healthy living with our wellness products.',
      thumbnailUrl: null,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      rewardAmount: 20,
      watchDuration: 60,
      dailyLimit: 10,
      totalBudget: 12000,
      status: 'ACTIVE' as const,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'EdTech Platform',
      sponsor: 'LearnFast Academy',
      description: 'Explore online courses and upskill yourself today.',
      thumbnailUrl: null,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      rewardAmount: 20,
      watchDuration: 30,
      dailyLimit: 10,
      totalBudget: 20000,
      status: 'ACTIVE' as const,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Travel Deals',
      sponsor: 'TravelGo',
      description: 'Exclusive travel packages at unbeatable prices.',
      thumbnailUrl: null,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      rewardAmount: 20,
      watchDuration: 30,
      dailyLimit: 10,
      totalBudget: 5000,
      status: 'PAUSED' as const,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ]

  for (const campaign of campaigns) {
    const existing = await prisma.videoCampaign.findFirst({
      where: { name: campaign.name },
    })
    if (!existing) {
      await prisma.videoCampaign.create({ data: campaign })
    }
  }
  console.log('✅ Demo campaigns seeded')

  console.log('\n🎉 Database seeded successfully!')
  console.log('   Admin: admin@virelo.com / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
