import { motion } from 'framer-motion'
import { type SpeechScore } from '../utils/speechAnalyzer'

const CAT_LABELS: Record<string, string> = {
  timing: 'Timing', opening: 'Formal Address', diplomaticLanguage: 'Diplomatic Language',
  countryPosition: 'Country Position', structure: 'Speech Structure',
  evidence: 'Evidence & Facts', callToAction: 'Call to Action',
}
const CAT_ICONS: Record<string, string> = {
  timing: '⏱', opening: '🎙', diplomaticLanguage: '📜',
  countryPosition: '🌍', structure: '🏗', evidence: '📊', callToAction: '📢',
}

export default function SpeechFeedback({ score, onRetry }: { score: SpeechScore; onRetry: () => void }) {
  const pct = score.total
  const tier = pct >= 75 ? 'high' : pct >= 50 ? 'mid' : 'low'
  const scoreColor = tier === 'high' ? 'var(--blue-hi)' : tier === 'mid' ? 'var(--text2)' : 'var(--muted)'

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

      {/* Total score */}
      <div className="card" style={{ padding: '28px', textAlign: 'center', borderTop: `2px solid ${scoreColor}` }}>
        <motion.div initial={{ scale: 0.75 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
          <span className="display" style={{ fontSize: 60, color: scoreColor }}>{score.total}</span>
          <span style={{ fontSize: 22, color: '#a8a89e', fontWeight: 300 }}>/100</span>
        </motion.div>
        <div style={{ fontSize: 13, fontWeight: 700, color: scoreColor, marginTop: 6, letterSpacing: '0.04em', fontFamily: 'Space Mono, monospace' }}>
          {score.badgeEmoji} {score.badge.toUpperCase()}
        </div>
        <div style={{ marginTop: 14, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', maxWidth: 200, margin: '14px auto 0' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: 2, background: scoreColor }}
          />
        </div>
      </div>

      {/* Categories */}
      {Object.entries(score.categories).map(([key, cat], i) => {
        const catPct = Math.round((cat.score / cat.max) * 100)
        const c = catPct >= 70 ? 'var(--blue-hi)' : catPct >= 40 ? 'var(--text2)' : 'var(--muted)'
        return (
          <motion.div key={key}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06 * i }}
            className="card"
            style={{ padding: '14px 16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#e8e8e0' }}>{CAT_ICONS[key]} {CAT_LABELS[key]}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: c, fontFamily: 'Space Mono, monospace' }}>{cat.score}/{cat.max}</span>
            </div>
            <div className="prog-track" style={{ height: 2.5, marginBottom: 8 }}>
              <motion.div className="prog-fill"
                initial={{ width: 0 }}
                animate={{ width: `${catPct}%` }}
                transition={{ duration: 0.9, delay: 0.1 + 0.06 * i }}
                style={{ background: c }}
              />
            </div>
            <p style={{ fontSize: 12, color: '#68686a', lineHeight: 1.6 }}>{cat.feedback}</p>
            {key === 'diplomaticLanguage' && 'found' in cat && (cat.found as string[]).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {(cat.found as string[]).map(p => (
                  <span key={p} className="badge badge-gold" style={{ fontSize: 10 }}>✓ {p}</span>
                ))}
              </div>
            )}
          </motion.div>
        )
      })}

      {/* Tips */}
      {score.generalTips.length > 0 && (
        <div className="card" style={{ padding: '16px 18px', borderLeft: '2px solid rgba(200,136,58,0.35)' }}>
          <div className="label" style={{ color: '#c8883a', marginBottom: 10 }}>Pro Tips</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {score.generalTips.map((tip, i) => (
              <li key={i} style={{ display: 'flex', gap: 9, fontSize: 12, color: '#a8a89e', lineHeight: 1.6 }}>
                <span style={{ color: '#c8883a', flexShrink: 0, opacity: 0.7 }}>—</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Phrase reference */}
      <div className="card" style={{ padding: '16px 18px' }}>
        <div className="label" style={{ color: '#68686a', marginBottom: 10 }}>Phrases to Memorize</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {score.samplePhrases.map((p, i) => (
            <div key={i} style={{
              fontSize: 11.5, fontFamily: 'Space Mono, monospace', color: '#a8a89e',
              background: 'rgba(255,255,255,0.025)', borderRadius: 4,
              padding: '6px 10px', border: '1px solid rgba(255,255,255,0.05)',
            }}>{p}</div>
          ))}
        </div>
      </div>

      <button onClick={onRetry} className="btn btn-cobalt" style={{ width: '100%', padding: '12px 0' }}>
        Practice Again
      </button>
    </motion.div>
  )
}
