import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { COUNTRIES, COMMITTEES } from '../data/munData'
import {
  generateUnmodScenario, generateStrategyQuestions, generateRoleplayResponse,
  type GeneratedUnmodScenario, type StrategyQuestion, type RoleplayResponse,
} from '../utils/munGenerator'

type Phase = 'setup' | 'scenario' | 'strategy' | 'quiz' | 'roleplay' | 'debrief'

interface ChatMessage {
  role: 'you' | 'them'
  text: string
  hint?: string
}

interface RoleplayState {
  country: typeof COUNTRIES[0]
  messages: ChatMessage[]
  input: string
  done: boolean
  sentiment?: 'positive' | 'neutral' | 'negative'
}

export default function UnmodCaucus() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [yourCountry, setYourCountry] = useState(COUNTRIES[0])
  const [committee, setCommittee] = useState(COMMITTEES[0])
  const [topic, setTopic] = useState('')
  const [scenario, setScenario] = useState<GeneratedUnmodScenario | null>(null)
  const [strategy, setStrategy] = useState('')
  const [quizQuestions, setQuizQuestions] = useState<StrategyQuestion[]>([])
  const [quizIdx, setQuizIdx] = useState(0)
  const [quizSelected, setQuizSelected] = useState<number | null>(null)
  const [quizScore, setQuizScore] = useState(0)
  const [roleplays, setRoleplays] = useState<RoleplayState[]>([])
  const [activeRoleplay, setActiveRoleplay] = useState(0)
  const [timerSecs, setTimerSecs] = useState(600)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerRemaining, setTimerRemaining] = useState(600)
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null)

  const generateScenario = () => {
    const sc = generateUnmodScenario(yourCountry, topic)
    const qs = generateStrategyQuestions(yourCountry, sc.blocPartners, sc.opposition, topic)
    setScenario(sc)
    setQuizQuestions(qs)
    setQuizIdx(0)
    setQuizSelected(null)
    setQuizScore(0)
    setRoleplays(sc.blocPartners.map(c => ({ country: c, messages: [], input: '', done: false })))
    setActiveRoleplay(0)
    setTimerRemaining(timerSecs)
    setPhase('scenario')
  }

  const handleQuizAnswer = (idx: number) => {
    if (quizSelected !== null) return
    setQuizSelected(idx)
    if (idx === quizQuestions[quizIdx].correctIndex) setQuizScore(s => s + 1)
  }

  const nextQuestion = () => {
    setQuizSelected(null)
    if (quizIdx + 1 >= quizQuestions.length) {
      setPhase('roleplay')
    } else {
      setQuizIdx(i => i + 1)
    }
  }

  const sendMessage = (rpIdx: number) => {
    setRoleplays(prev => {
      const updated = [...prev]
      const rp = { ...updated[rpIdx] }
      if (!rp.input.trim()) return prev
      const userMsg: ChatMessage = { role: 'you', text: rp.input }
      const response: RoleplayResponse = generateRoleplayResponse(rp.country, rp.input, topic)
      const themMsg: ChatMessage = { role: 'them', text: response.text, hint: response.hint }
      rp.messages = [...rp.messages, userMsg, themMsg]
      rp.input = ''
      rp.sentiment = response.sentiment
      if (rp.messages.filter(m => m.role === 'you').length >= 3) rp.done = true
      updated[rpIdx] = rp
      return updated
    })
  }

  const startTimer = () => {
    setTimerRunning(true)
    const id = setInterval(() => {
      setTimerRemaining(r => {
        if (r <= 1) { clearInterval(id); setTimerRunning(false); return 0 }
        return r - 1
      })
    }, 1000)
    setTimerInterval(id)
  }

  const stopTimer = () => {
    setTimerRunning(false)
    if (timerInterval) clearInterval(timerInterval)
  }

  const remMins = Math.floor(timerRemaining / 60)
  const remSecs = timerRemaining % 60
  const timerPct = timerRemaining / timerSecs
  const timerColor = timerPct > 0.4 ? '#2dd4bf' : timerPct > 0.2 ? '#e8b84d' : '#fb7185'

  const currentRP = roleplays[activeRoleplay]
  const sentimentColors = { positive: '#2dd4bf', neutral: '#e8b84d', negative: '#fb7185' }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="accent-line-gold" />
        <h1 className="display text-white" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
          Unmoderated Caucus
        </h1>
        <p style={{ color: '#7d8597', fontSize: 13, marginTop: 4 }}>
          Get a generated diplomatic scenario, test your strategy, then roleplay approaching other delegations.
        </p>
      </div>

      <AnimatePresence mode="wait">

        {/* ── SETUP ── */}
        {phase === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <div className="card p-5">
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7d8597', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                  Your Country
                </label>
                <select value={yourCountry.name}
                  onChange={e => setYourCountry(COUNTRIES.find(c => c.name === e.target.value)!)}
                  className="w-full px-3 py-2.5 text-sm"
                  style={{ background: '#12111d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#dde1ed' }}
                >
                  {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
                </select>
              </div>

              <div className="card p-5">
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7d8597', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                  Committee
                </label>
                <select value={committee.name}
                  onChange={e => setCommittee(COMMITTEES.find(c => c.name === e.target.value)!)}
                  className="w-full px-3 py-2.5 text-sm mb-4"
                  style={{ background: '#12111d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#dde1ed' }}
                >
                  {COMMITTEES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7d8597', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Topic
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {committee.topics.slice(0, 5).map(t => (
                    <button key={t} onClick={() => setTopic(t)}
                      style={{
                        fontSize: 11, padding: '5px 10px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
                        background: topic === t ? 'rgba(201,151,58,0.12)' : 'transparent',
                        border: topic === t ? '1px solid rgba(201,151,58,0.3)' : '1px solid rgba(255,255,255,0.07)',
                        color: topic === t ? '#e8b84d' : '#7d8597',
                      }}>{t}</button>
                  ))}
                </div>
                <input value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="Or type a custom topic..."
                  className="w-full px-3 py-2.5 text-sm"
                  style={{ background: '#12111d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#dde1ed' }} />
              </div>

              <div className="card p-5">
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7d8597', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                  Unmod Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5*60, 10*60, 15*60, 20*60].map(s => (
                    <button key={s} onClick={() => { setTimerSecs(s); setTimerRemaining(s) }}
                      style={{
                        padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                        background: timerSecs === s ? '#c9973a' : '#12111d',
                        border: timerSecs === s ? '1px solid #c9973a' : '1px solid rgba(255,255,255,0.08)',
                        color: timerSecs === s ? '#08080f' : '#7d8597',
                      }}>{s/60}m</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="card p-5" style={{ borderTop: '3px solid #14b8a6' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2dd4bf', marginBottom: 8 }}>What happens in this simulation:</h3>
                <div className="space-y-3">
                  {[
                    { step: '1', title: 'Scenario Generated', desc: 'See the current state of the room — the key tension, your natural allies, and who\'s blocking you.' },
                    { step: '2', title: 'Strategy Quiz', desc: '3 questions test whether your diplomatic instincts are correct. Get specific feedback on each answer.' },
                    { step: '3', title: 'Roleplay Negotiations', desc: 'Approach each bloc partner in a chat interface. Your opener is evaluated — good keyword usage gets positive responses.' },
                  ].map(s => (
                    <div key={s.step} className="flex gap-3">
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#2dd4bf', flexShrink: 0, marginTop: 1 }}>
                        {s.step}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#dde1ed' }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: '#7d8597', lineHeight: 1.5 }}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-4 card-gold">
                <p style={{ fontSize: 12, fontWeight: 700, color: '#e8b84d', marginBottom: 6 }}>Tip before you start</p>
                <p style={{ fontSize: 12, color: '#7d8597', lineHeight: 1.6 }}>
                  In a real unmod, the first 60 seconds matter most. Know which country you're approaching first and what you'll offer them — before you even stand up from your seat.
                </p>
              </div>

              <button onClick={generateScenario} disabled={!topic.trim()} className="btn-gold w-full" style={{ padding: '14px 0', fontSize: 15 }}>
                {topic.trim() ? 'Generate Scenario →' : 'Select a topic first'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── SCENARIO ── */}
        {phase === 'scenario' && scenario && (
          <motion.div key="scenario" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <div className="card p-5" style={{ borderTop: '3px solid #3d5af1' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b84f5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Current Situation
                </p>
                <p style={{ fontSize: 14, color: '#dde1ed', lineHeight: 1.7 }}>{scenario.context}</p>
              </div>

              <div className="card p-5" style={{ borderTop: '3px solid #c9973a' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#e8b84d', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  You're Playing
                </p>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 32 }}>{yourCountry.flag}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#dde1ed' }}>{yourCountry.name}</div>
                    <div style={{ fontSize: 12, color: '#7d8597', marginTop: 2 }}>{committee.name} · {topic}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {yourCountry.keywords.map(k => <span key={k} className="badge badge-gold" style={{ fontSize: 10 }}>{k}</span>)}
                </div>
              </div>

              <div className="card p-5">
                <p style={{ fontSize: 11, fontWeight: 700, color: '#fb7185', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Who's Blocking You
                </p>
                {scenario.opposition.map(c => (
                  <div key={c.name} className="flex gap-3 items-start py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 20 }}>{c.flag}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#dde1ed' }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#7d8597' }}>Cares about: {c.keywords[0]}, {c.keywords[1] || c.keywords[0]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card p-5" style={{ borderTop: '3px solid #14b8a6' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#2dd4bf', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Your Recommended Bloc Partners
                </p>
                <p style={{ fontSize: 12, color: '#7d8597', marginBottom: 12 }}>
                  These countries share key interests with {yourCountry.name}. You'll roleplay approaching each one.
                </p>
                {scenario.blocPartners.map((c, i) => (
                  <div key={c.name} className="card p-3 mb-2" style={{ background: 'rgba(20,184,166,0.04)', border: '1px solid rgba(20,184,166,0.1)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 20 }}>{c.flag}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#dde1ed' }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: '#2dd4bf', marginLeft: 'auto' }}>Partner {i + 1}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#7d8597', lineHeight: 1.5 }}>
                      Key interests: <span style={{ color: '#93a9ff' }}>{c.keywords.slice(0, 3).join(', ')}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#7d8597', marginTop: 4, fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{c.position.slice(0, 110)}..."
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setPhase('strategy')} className="btn-gold w-full" style={{ padding: '14px 0', fontSize: 15 }}>
                Write Your Strategy →
              </button>
              <button onClick={() => setPhase('setup')} className="btn-ghost w-full">← Change Setup</button>
            </div>
          </motion.div>
        )}

        {/* ── QUIZ ── */}
        {/* ── STRATEGY ── */}
        {phase === 'strategy' && scenario && (
          <motion.div key="strategy" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ maxWidth:640, margin:'0 auto' }}
          >
            <div className="card" style={{ padding:'32px', borderTop:'2px solid #c8922a' }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.13em', textTransform:'uppercase', color:'#c8922a', marginBottom:6 }}>
                Your Strategy
              </div>
              <h2 className="display" style={{ fontSize:'1.55rem', marginBottom:6 }}>Write your plan before the clock starts</h2>
              <p style={{ fontSize:13, color:'#6e7587', lineHeight:1.6, marginBottom:24 }}>
                In a real unmod you get no warm-up time. Write out your approach now — who you'll talk to first, what you're offering, and where you won't budge. You'll compare this against expert strategy after the roleplay.
              </p>

              {/* Bloc partner reminder */}
              <div className="card" style={{ padding:'14px 16px', marginBottom:20, background:'rgba(15,168,142,0.04)', borderColor:'rgba(15,168,142,0.14)' }}>
                <div style={{ fontSize:11.5, fontWeight:700, color:'#1fcfb2', marginBottom:8, letterSpacing:'0.08em', textTransform:'uppercase' }}>Your Bloc Partners to Approach</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {scenario.blocPartners.map(c => (
                    <span key={c.name} className="badge badge-teal">{c.flag} {c.name} — cares about {c.keywords[0]}</span>
                  ))}
                </div>
              </div>

              {/* Prompts + textarea */}
              <div style={{ fontSize:12, color:'#6e7587', marginBottom:10, lineHeight:1.7 }}>
                Answer these in your strategy (as many as you can):
              </div>
              <ul style={{ fontSize:12, color:'#3d3c4e', lineHeight:1.8, marginBottom:14, paddingLeft:16, listStyleType:'disc' }}>
                <li>Who will you approach first, and why?</li>
                <li>What specific language or concession will you offer each partner?</li>
                <li>How will you handle {scenario.opposition[0]?.name || 'the opposition'}?</li>
                <li>What's your red line — what will you NOT give up in this resolution?</li>
              </ul>
              <textarea
                value={strategy}
                onChange={e => setStrategy(e.target.value)}
                placeholder="I'll start by approaching [Country] because they care about [keyword], which aligns with our position on [topic]. My opening offer will be…"
                style={{ width:'100%', minHeight:200, padding:'12px 14px', fontSize:13.5, lineHeight:1.65, borderRadius:9, background:'#0e0d17', border:'1px solid rgba(255,255,255,0.08)', color:'#dfe2ee', marginBottom:16 }}
                autoFocus
              />

              <div style={{ display:'flex', gap:10 }}>
                <button
                  onClick={() => setPhase('quiz')}
                  disabled={strategy.trim().length < 20}
                  className="btn btn-gold"
                  style={{ flex:1, padding:'12px 0' }}
                >
                  {strategy.trim().length < 20 ? 'Write at least a sentence…' : 'Test Your Strategy →'}
                </button>
                <button onClick={() => setPhase('scenario')} className="btn btn-ghost">← Back</button>
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'quiz' && quizQuestions.length > 0 && (
          <motion.div key="quiz" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="card p-7" style={{ borderTop: '3px solid #3d5af1' }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12, color: '#7d8597' }}>Strategy Quiz · Question {quizIdx + 1} of {quizQuestions.length}</span>
                <span style={{ fontSize: 12, color: '#6b84f5' }}>{quizScore} correct</span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, background: '#3d5af1', width: `${(quizIdx / quizQuestions.length) * 100}%`, transition: 'width 0.4s ease' }} />
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#dde1ed', marginBottom: 20, lineHeight: 1.5 }}>
                {quizQuestions[quizIdx].question}
              </h3>

              <div className="space-y-2.5 mb-5">
                {quizQuestions[quizIdx].options.map((opt, i) => {
                  const isSelected = quizSelected === i
                  const isCorrect = i === quizQuestions[quizIdx].correctIndex
                  const revealed = quizSelected !== null
                  return (
                    <motion.button key={i} whileHover={quizSelected === null ? { x: 4 } : {}}
                      onClick={() => handleQuizAnswer(i)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: 10, fontSize: 13,
                        fontWeight: 500, cursor: quizSelected !== null ? 'default' : 'pointer', transition: 'all 0.15s',
                        background: revealed && isCorrect ? 'rgba(45,212,191,0.12)' :
                                    revealed && isSelected && !isCorrect ? 'rgba(244,63,94,0.1)' :
                                    !revealed ? '#12111d' : 'rgba(255,255,255,0.02)',
                        border: revealed && isCorrect ? '1px solid rgba(45,212,191,0.35)' :
                                revealed && isSelected && !isCorrect ? '1px solid rgba(244,63,94,0.3)' :
                                !revealed ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.04)',
                        color: revealed && isCorrect ? '#2dd4bf' :
                               revealed && isSelected && !isCorrect ? '#fb7185' :
                               !revealed ? '#dde1ed' : '#44404f',
                      }}>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.6, marginRight: 8 }}>
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                      {revealed && isCorrect && <span style={{ float: 'right' }}>✓</span>}
                      {revealed && isSelected && !isCorrect && <span style={{ float: 'right' }}>✗</span>}
                    </motion.button>
                  )
                })}
              </div>

              <AnimatePresence>
                {quizSelected !== null && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="card p-4 mb-5"
                    style={{
                      borderLeft: `3px solid ${quizSelected === quizQuestions[quizIdx].correctIndex ? '#2dd4bf' : '#fb7185'}`,
                      background: quizSelected === quizQuestions[quizIdx].correctIndex ? 'rgba(45,212,191,0.05)' : 'rgba(244,63,94,0.05)',
                    }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: quizSelected === quizQuestions[quizIdx].correctIndex ? '#2dd4bf' : '#fb7185' }}>
                      {quizSelected === quizQuestions[quizIdx].correctIndex ? '✓ Correct!' : '✗ Not quite'}
                    </div>
                    <p style={{ fontSize: 12, color: '#7d8597', lineHeight: 1.6 }}>
                      {quizQuestions[quizIdx].explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {quizSelected !== null && (
                <button onClick={nextQuestion} className="btn-gold w-full" style={{ padding: '13px 0' }}>
                  {quizIdx + 1 < quizQuestions.length ? 'Next Question →' : 'Begin Roleplay →'}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── ROLEPLAY ── */}
        {phase === 'roleplay' && scenario && currentRP && (
          <motion.div key="roleplay" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Timer + header */}
            <div className="card p-4 mb-5" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#dde1ed' }}>Unmod Caucus — {timerSecs / 60} min</div>
                <div style={{ fontSize: 12, color: '#7d8597' }}>{committee.name} · {topic}</div>
              </div>
              <div className="flex items-center gap-4">
                <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: timerColor }}>
                  {remMins}:{remSecs.toString().padStart(2, '0')}
                </span>
                {!timerRunning ? (
                  <button onClick={startTimer} className="btn-gold" style={{ padding: '7px 16px', fontSize: 13 }}>Start Clock</button>
                ) : (
                  <button onClick={stopTimer} className="btn-cobalt" style={{ padding: '7px 16px', fontSize: 13 }}>Pause</button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {/* Left: country selector */}
              <div className="space-y-3">
                <div className="card p-4">
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#7d8597', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Who to Approach
                  </p>
                  {roleplays.map((rp, i) => {
                    const lastSentiment = rp.sentiment
                    return (
                      <button key={i} onClick={() => setActiveRoleplay(i)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                          background: activeRoleplay === i ? 'rgba(61,90,241,0.1)' : 'transparent',
                          border: activeRoleplay === i ? '1px solid rgba(61,90,241,0.25)' : '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 20 }}>{rp.country.flag}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#dde1ed' }}>{rp.country.name}</div>
                            <div style={{ fontSize: 11, color: '#7d8597' }}>
                              {rp.done ? '✓ Done' :
                               rp.messages.length === 0 ? 'Not approached yet' :
                               `${rp.messages.filter(m => m.role === 'you').length}/3 exchanges`}
                            </div>
                          </div>
                          {lastSentiment && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: sentimentColors[lastSentiment] }} />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="card p-4 card-gold">
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#e8b84d', marginBottom: 6 }}>Your opening hook</p>
                  <p style={{ fontSize: 12, color: '#7d8597', lineHeight: 1.5 }}>
                    Lead with what <em>you're offering</em>, not what you want. Mention their country's key interest within the first two sentences.
                  </p>
                </div>

                {roleplays.every(r => r.done || r.messages.length >= 4) && (
                  <button onClick={() => setPhase('debrief')} className="btn-gold w-full" style={{ padding: '12px 0' }}>
                    Finish & Debrief →
                  </button>
                )}
              </div>

              {/* Right: chat */}
              <div className="md:col-span-2 space-y-4">
                <div className="card p-5" style={{ borderTop: '3px solid #14b8a6' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <span style={{ fontSize: 36 }}>{currentRP.country.flag}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#dde1ed' }}>{currentRP.country.name}</div>
                      <div style={{ fontSize: 12, color: '#7d8597' }}>
                        Key interests: <span style={{ color: '#93a9ff' }}>{currentRP.country.keywords.slice(0, 3).join(', ')}</span>
                      </div>
                    </div>
                    {currentRP.sentiment && (
                      <div style={{
                        marginLeft: 'auto', padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                        background: currentRP.sentiment === 'positive' ? 'rgba(45,212,191,0.1)' :
                                    currentRP.sentiment === 'negative' ? 'rgba(244,63,94,0.1)' : 'rgba(232,184,77,0.1)',
                        color: sentimentColors[currentRP.sentiment],
                      }}>
                        {currentRP.sentiment === 'positive' ? '✓ Receptive' :
                         currentRP.sentiment === 'negative' ? '✗ Resistant' : '~ Uncertain'}
                      </div>
                    )}
                  </div>

                  {/* Chat messages */}
                  <div style={{ minHeight: 200, maxHeight: 320, overflowY: 'auto', marginBottom: 12 }}>
                    {currentRP.messages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <p style={{ fontSize: 14, color: '#44404f', marginBottom: 6 }}>You haven't approached this delegation yet.</p>
                        <p style={{ fontSize: 12, color: '#2d2a42' }}>
                          Write your opening message below. Mention their key interests to get a positive response.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentRP.messages.map((msg, i) => (
                          <div key={i}>
                            {msg.role === 'you' ? (
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <div className="bubble-you">{msg.text}</div>
                              </div>
                            ) : (
                              <div>
                                <div className="bubble-them">{msg.text}</div>
                                {msg.hint && (
                                  <div style={{ fontSize: 11, color: '#e8b84d', marginTop: 4, marginLeft: 4, fontStyle: 'italic' }}>
                                    💡 {msg.hint}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  {!currentRP.done ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <textarea
                        value={currentRP.input}
                        onChange={e => setRoleplays(prev => {
                          const updated = [...prev]
                          updated[activeRoleplay] = { ...updated[activeRoleplay], input: e.target.value }
                          return updated
                        })}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(activeRoleplay) } }}
                        placeholder={currentRP.messages.length === 0 ?
                          `"Esteemed colleague from ${currentRP.country.name}, the delegation of ${yourCountry.name} would like to discuss..."` :
                          "Continue the negotiation... (Enter to send)"
                        }
                        style={{
                          flex: 1, background: '#12111d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                          padding: '10px 12px', color: '#dde1ed', fontSize: 13, lineHeight: 1.5, minHeight: 80,
                        }}
                      />
                      <button onClick={() => sendMessage(activeRoleplay)}
                        disabled={!currentRP.input.trim()}
                        className="btn-cobalt" style={{ padding: '0 16px', alignSelf: 'flex-end', height: 40 }}>
                        Send
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(45,212,191,0.07)', borderRadius: 10, border: '1px solid rgba(45,212,191,0.15)' }}>
                      <p style={{ fontSize: 13, color: '#2dd4bf', fontWeight: 600 }}>
                        ✓ Negotiation with {currentRP.country.name} complete
                      </p>
                      <p style={{ fontSize: 12, color: '#7d8597', marginTop: 2 }}>
                        {currentRP.sentiment === 'positive' ? 'Strong outcome — this delegation is likely to co-sponsor.' :
                         currentRP.sentiment === 'neutral' ? 'Mixed result — they may abstain or need more work.' :
                         'Difficult — consider revising your approach or accepting their loss.'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="card p-4 card-cobalt">
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#93a9ff', marginBottom: 4 }}>Strategy note</p>
                  <p style={{ fontSize: 12, color: '#7d8597', lineHeight: 1.5 }}>
                    Mention "{currentRP.country.keywords[0]}" or "{currentRP.country.keywords[1] || currentRP.country.keywords[0]}" in your message and make a specific offer to get a positive response from {currentRP.country.name}.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── DEBRIEF ── */}
        {phase === 'debrief' && scenario && (
          <motion.div key="debrief" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="card p-8" style={{ borderTop: '3px solid #c9973a' }}>
              <h2 className="display text-white mb-2" style={{ fontSize: '1.8rem' }}>Unmod Debrief</h2>
              <p style={{ color: '#7d8597', fontSize: 13, marginBottom: 20 }}>
                {committee.name} · {topic} · as {yourCountry.flag} {yourCountry.name}
              </p>

              {/* Player's written strategy */}
              {strategy.trim().length > 0 && (
                <div className="card p-4 card-gold" style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#e8b84d', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Your Written Strategy
                  </div>
                  <p style={{ fontSize: 13, color: '#dde1ed', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{strategy}</p>
                  <p style={{ fontSize: 11.5, color: '#6e7587', marginTop: 10, fontStyle: 'italic' }}>
                    Compare this against how the roleplay actually went — did your plan hold up?
                  </p>
                </div>
              )}

              {/* Results per country */}
              <div className="space-y-3 mb-6">
                {roleplays.map((rp, i) => (
                  <div key={i} className="card p-4" style={{
                    borderLeft: `3px solid ${rp.sentiment === 'positive' ? '#2dd4bf' : rp.sentiment === 'negative' ? '#fb7185' : '#e8b84d'}`
                  }}>
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: 24 }}>{rp.country.flag}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#dde1ed' }}>{rp.country.name}</div>
                        <div style={{ fontSize: 12, color: '#7d8597' }}>{rp.messages.filter(m => m.role === 'you').length} messages sent</div>
                      </div>
                      <div style={{
                        padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                        background: rp.sentiment === 'positive' ? 'rgba(45,212,191,0.1)' :
                                    rp.sentiment === 'negative' ? 'rgba(244,63,94,0.1)' : 'rgba(232,184,77,0.1)',
                        color: rp.sentiment ? sentimentColors[rp.sentiment] : '#7d8597',
                      }}>
                        {rp.messages.length === 0 ? 'Not approached' :
                         rp.sentiment === 'positive' ? '✓ Co-sponsor likely' :
                         rp.sentiment === 'negative' ? '✗ Resistant' : '~ Uncertain'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quiz result */}
              <div className="card p-4 mb-5" style={{ borderLeft: '3px solid #3d5af1', background: 'rgba(61,90,241,0.04)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#93a9ff', marginBottom: 4 }}>
                  Strategy Quiz: {quizScore}/{quizQuestions.length} correct
                </div>
                <p style={{ fontSize: 12, color: '#7d8597', lineHeight: 1.5 }}>
                  {quizScore === quizQuestions.length ? 'Perfect strategic instincts — you understand the diplomatic calculus.' :
                   quizScore >= 2 ? 'Good strategic thinking. Review the one you missed — the explanation is key.' :
                   'Strategy needs work. The quiz explanations contain the core principles — re-read them carefully.'}
                </p>
              </div>

              <div className="card p-4 mb-6 card-gold">
                <p style={{ fontSize: 12, fontWeight: 700, color: '#e8b84d', marginBottom: 6 }}>Key takeaway for your next unmod</p>
                <p style={{ fontSize: 12, color: '#7d8597', lineHeight: 1.6 }}>
                  Always mention the target country's <strong style={{ color: '#dde1ed' }}>primary keyword</strong> in your opening.
                  Lead with what you're <strong style={{ color: '#dde1ed' }}>offering</strong>, not what you want.
                  Get a verbal yes before asking for a written signature.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { generateScenario() }} className="btn-gold flex-1" style={{ padding: '12px 0' }}>
                  New Scenario
                </button>
                <button onClick={() => setPhase('setup')} className="btn-ghost flex-1">Change Setup</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
