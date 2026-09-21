'use client'
import { useState } from 'react'

const FAQ_ITEMS = [
  { q: 'How do I earn rewards?', a: 'Watch sponsored videos for the required duration. Rewards are server-validated.' },
  { q: 'When do referral rewards credit?', a: 'After your referred friend completes their first eligible video.' },
  { q: 'What is the minimum withdrawal?', a: 'Minimum withdrawal is ₹2,000 (configurable by admin).' },
  { q: 'Why was my reward not credited?', a: 'Rewards require validated watch duration and passing fraud checks.' },
]

export default function SupportPage() {
  const [form, setForm] = useState({ subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Support</h1>
        <p style={{ color: 'var(--text-muted)' }}>We&apos;re here to help. Check the FAQ or send us a message.</p>
      </div>

      {/* FAQ */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Common Questions</h2>
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} style={{ padding: '14px 0', borderBottom: i < FAQ_ITEMS.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{item.q}</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.a}</p>
          </div>
        ))}
      </div>

      {/* Contact form */}
      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Send us a Message</h2>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ marginBottom: 8 }}>Message Sent</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>We&apos;ll get back to you within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label">Subject</label>
              <input type="text" className="input" id="support-subject" placeholder="What do you need help with?" value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} required />
            </div>
            <div className="input-group">
              <label className="input-label">Message</label>
              <textarea className="input" id="support-message" placeholder="Describe your issue in detail..." value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} required rows={5} style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" id="support-submit">Send Message</button>
          </form>
        )}
      </div>
    </div>
  )
}
