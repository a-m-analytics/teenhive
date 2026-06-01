import { motion } from 'framer-motion'
import { type Page } from '../App'

interface Props { onNavigate: (p: Page) => void }

const features: { id: Page; n: string; title: string; desc: string; tag: string }[] = [
  { id: 'speech',    n: '01', title: 'Speech Practice',    tag: 'SCORE',    desc: 'Write your position under time pressure. Rated on 7 criteria: diplomatic language, structure, evidence, timing, and more.' },
  { id: 'mod',       n: '02', title: 'Mod Caucus',         tag: 'SIMULATE', desc: 'Go first in the speakers list. Read generated rival stances, deliver speeches, get scored against real debate criteria.' },
  { id: 'unmod',     n: '03', title: 'Unmod Caucus',       tag: 'ROLEPLAY', desc: 'Write your strategy, get quizzed on your approach, then roleplay lobbying potential bloc partners in a live chat.' },
  { id: 'procedure', n: '04', title: 'Procedure Guide',    tag: 'LEARN',    desc: 'Every point and motion with flashcard practice mode and a scenario quiz. Know your procedure cold before committee.' },
]

const TIPS = [
  { h: 'Third person only',          b: '"The delegation of [Country] believes…" — never "I think." The most immediate signal chairs use to judge delegate training.' },
  { h: 'Hit your time exactly',      b: 'Finishing at 95–100% of your speaking time signals preparation. Under 70% means you ran out of content.' },
  { h: 'One stat beats five claims', b: '"67% of displaced persons lack legal ID" lands harder than three vague arguments. Specific numbers are remembered.' },
  { h: 'Unmod is where awards are won', b: 'No one wins Best Delegate from speeches alone. Lead the draft. Hold your bloc. Bring in swing votes during unmod.' },
  { h: 'Prep your bloc before Day 1',   b: 'Research which 3–5 countries share your interests. Have opening lines ready before the first unmod starts.' },
  { h: 'Reference previous speakers',  b: '"Building on what the delegate of France noted…" — shows engagement. Chairs notice this and reward it.' },
]

export default function Home({ onNavigate }: Props) {
  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '88px 28px 96px' }}>
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }} className="animate-pulse" />
            <span className="label">Free · Model UN Practice Platform</span>
          </div>

          <h1 className="display" style={{ fontSize: 'clamp(3.4rem,7vw,6.5rem)', marginBottom: 24, maxWidth: 820 }}>
            Win awards at{' '}
            <span className="shimmer-blue">Model UN.</span>
          </h1>

          <p style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.75, maxWidth: 480, marginBottom: 36, fontWeight: 400 }}>
            Practice speeches with real judging criteria, simulate caucuses with generated country stances, and master procedure — the way Distinguished Delegates prepare.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 56 }}>
            <button onClick={() => onNavigate('speech')} className="btn btn-primary" style={{ padding: '13px 32px', fontSize: 14 }}>
              Start Practicing →
            </button>
            <button onClick={() => onNavigate('procedure')} className="btn btn-ghost" style={{ padding: '13px 24px', fontSize: 13 }}>
              Learn procedure first
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', paddingTop: 28 }}>
            {[['25+', 'Countries'], ['9', 'Committees'], ['7', 'Score criteria'], ['3', 'Practice modes']].map(([n, l], i) => (
              <div key={l} style={{
                flex: 1, borderRight: i < 3 ? '1px solid var(--border)' : 'none',
                paddingRight: 24, marginRight: 24,
              }}>
                <div className="display" style={{ fontSize: 26, color: 'var(--text)' }}>{n}</div>
                <div className="label" style={{ marginTop: 5, fontSize: 9 }}>{l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', maxWidth: 1120, margin: '0 auto 0', padding: '0 28px' }} />

      {/* ── Features ── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '72px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 36 }}>
          <h2 className="display" style={{ fontSize: 'clamp(1.4rem,2.5vw,1.9rem)' }}>Four ways to get better</h2>
          <span className="label">Practice modules</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))', gap: 1, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {features.map((f, i) => (
            <motion.button key={f.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              onClick={() => onNavigate(f.id)}
              style={{
                textAlign: 'left', padding: '28px 24px',
                background: 'var(--surface)',
                borderRight: i < 3 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer', border: 'none',
                transition: 'background 0.14s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <span className="label" style={{ color: 'var(--blue)', fontSize: 9 }}>{f.tag}</span>
                <span className="label" style={{ color: 'var(--muted)', fontSize: 9 }}>{f.n}</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 10, letterSpacing: '-0.02em' }}>{f.title}</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 18 }}>{f.desc}</p>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', letterSpacing: '-0.01em' }}>Open →</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', maxWidth: 1120, margin: '0 auto', padding: '0 28px' }} />

      {/* ── Tips ── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '72px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 36 }}>
          <h2 className="display" style={{ fontSize: 'clamp(1.4rem,2.5vw,1.9rem)' }}>What separates good from great</h2>
          <span className="label">Strategy tips</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {TIPS.map((tip, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="card"
              style={{ padding: '18px 18px 18px 20px', borderLeft: '2px solid rgba(65,105,255,0.3)' }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 7, letterSpacing: '-0.01em' }}>{tip.h}</div>
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.68 }}>{tip.b}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', maxWidth: 1120, margin: '0 auto', padding: '0 28px' }} />

      {/* ── CTA ── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '72px 28px 88px' }}>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center',
            padding: '44px 44px', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, borderTop: '1px solid rgba(65,105,255,0.3)',
          }}
        >
          <div>
            <p className="label" style={{ color: 'var(--blue)', marginBottom: 10 }}>Ready to start</p>
            <h2 className="display" style={{ fontSize: 'clamp(1.5rem,3vw,2.4rem)', marginBottom: 10 }}>
              The best delegates<br />are the most prepared.
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.7 }}>
              Winning isn't about being the smartest in the room.<br />It's about doing the work before you enter it.
            </p>
          </div>
          <button onClick={() => onNavigate('speech')} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 14, flexShrink: 0 }}>
            Begin Practice →
          </button>
        </motion.div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 0', textAlign: 'center' }}>
        <span className="label" style={{ color: 'var(--muted)', opacity: 0.4 }}>Rostrum — Model UN Practice Platform</span>
      </footer>
    </div>
  )
}
