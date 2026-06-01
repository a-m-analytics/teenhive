import { motion } from 'framer-motion'
import { type Page } from '../App'

const TICKER = [
  'Calls Upon All Member States',
  'Notes With Deep Concern',
  'Strongly Urges The Committee',
  'Reaffirms Its Commitment',
  'Recognizes The Importance Of',
  'Emphasizes The Need For',
  'Welcoming All Efforts Toward Peace',
  'Deeply Concerned By Recent Events',
  'Urges Immediate Multilateral Action',
  'Bearing In Mind The UN Charter',
  'Pursuant To Resolution 2758',
  'Taking Into Account The Report Of',
  'Affirming The Sovereign Rights Of',
  'Recalling Its Previous Resolutions',
]
const items = [...TICKER, ...TICKER]

const links: { id: Page; label: string }[] = [
  { id: 'speech',    label: 'Speech' },
  { id: 'mod',       label: 'Mod Caucus' },
  { id: 'unmod',     label: 'Unmod Caucus' },
  { id: 'procedure', label: 'Procedure' },
]

export default function Navigation({ current, onNavigate }: { current: Page; onNavigate: (p: Page) => void }) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{
        background: 'rgba(7,8,15,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 28px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <button onClick={() => onNavigate('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'none', border: 'none' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'var(--blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: '#fff',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.04em',
            }}>R</div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 15, color: '#eceef8', letterSpacing: '-0.03em' }}>Rostrum</span>
          </button>

          {/* Desktop links */}
          <nav style={{ display: 'flex', gap: 2 }} className="hidden md:flex">
            {links.map(link => (
              <button key={link.id} onClick={() => onNavigate(link.id)} style={{
                position: 'relative', padding: '6px 14px', borderRadius: 6,
                fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                background: 'none', border: 'none',
                color: current === link.id ? '#eceef8' : '#404468',
                transition: 'color 0.14s',
              }}>
                {current === link.id && (
                  <motion.div layoutId="nav-pill"
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 6,
                      background: 'rgba(65,105,255,0.12)',
                      border: '1px solid rgba(65,105,255,0.22)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{link.label}</span>
              </button>
            ))}
          </nav>

          <button onClick={() => onNavigate('speech')} className="btn btn-primary" style={{ padding: '7px 18px', fontSize: 12 }}>
            Practice →
          </button>
        </div>

        {/* Mobile links */}
        <div className="md:hidden" style={{ display: 'flex', gap: 5, padding: '0 18px 10px', overflowX: 'auto' }}>
          {links.map(l => (
            <button key={l.id} onClick={() => onNavigate(l.id)} style={{
              whiteSpace: 'nowrap', padding: '5px 12px', borderRadius: 4,
              fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid',
              transition: 'all 0.14s',
              background: current === l.id ? 'var(--blue-dim)' : 'transparent',
              borderColor: current === l.id ? 'rgba(65,105,255,0.3)' : 'transparent',
              color: current === l.id ? 'var(--blue-hi)' : 'var(--muted)',
            }}>{l.label}</button>
          ))}
        </div>
      </div>

      {/* Ticker */}
      <div className="ticker-track" style={{
        background: 'rgba(5,6,12,0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '5px 0',
      }}>
        <div className="ticker-inner">
          {items.map((phrase, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, margin: '0 32px' }}>
              <span style={{ width: 2.5, height: 2.5, borderRadius: '50%', background: '#4169ff', opacity: 0.4, display: 'inline-block', flexShrink: 0 }} />
              <span className="label" style={{ color: '#1e2038' }}>{phrase}</span>
            </span>
          ))}
        </div>
      </div>
    </header>
  )
}
