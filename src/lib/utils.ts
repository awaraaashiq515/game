/**
 * Mask a user's name for public display (e.g. leaderboard).
 * "Abhinash" → "Ab***sh"
 */
export function maskName(name: string): string {
  if (!name || name.length <= 3) return name[0] + '***'
  const first = name.slice(0, 2)
  const last = name.slice(-2)
  return `${first}***${last}`
}

/**
 * Format a number as Indian Rupees.
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

/**
 * Generate a random alphanumeric referral code (8 chars).
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Format date as "Today, 1:32 PM" or "Yesterday" or "DD MMM YYYY"
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  const timeStr = d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  if (dateOnly.getTime() === today.getTime()) return `Today, ${timeStr}`
  if (dateOnly.getTime() === yesterday.getTime()) return `Yesterday, ${timeStr}`

  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Generate a unique request ID for withdrawals.
 */
export function generateRequestId(): string {
  const num = Math.floor(100000 + Math.random() * 900000)
  return `VR-${num}`
}

/**
 * Truncate text to a given length.
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Get the user's IP from a request.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return '127.0.0.1'
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Validate Indian mobile number format.
 */
export function isValidMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile)
}
