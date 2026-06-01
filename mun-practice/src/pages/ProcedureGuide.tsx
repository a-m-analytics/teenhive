import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PROCEDURE_ITEMS } from '../data/munData'

type Tab = 'reference' | 'flashcards' | 'quiz'

/* ── Quiz questions ── */
const QUIZ: { scenario: string; q: string; opts: string[]; answer: number; explain: string }[] = [
  {
    scenario: "You're in committee. The chair just let a speaker go 45 seconds over their allotted time.",
    q: "What do you raise?",
    opts: ['Point of Order', 'Point of Personal Privilege', 'Point of Parliamentary Inquiry', 'Right of Reply'],
    answer: 0,
    explain: 'Point of Order handles procedural violations — including time overruns. It can interrupt the speaker.'
  },
  {
    scenario: "Debate is getting scattered. You want 15 focused minutes on nuclear verification specifically.",
    q: "What do you motion for?",
    opts: ['Unmoderated Caucus', 'Moderated Caucus', 'Extend Debate', 'Close Speakers List'],
    answer: 1,
    explain: 'Moderated Caucus = structured debate with per-speaker time limits. You specify: total time, speaking time, and subtopic.'
  },
  {
    scenario: "Your bloc needs to quietly merge two working papers before the vote. You have no formal mechanism — yet.",
    q: "What do you call?",
    opts: ['Moderated Caucus', 'Table the Topic', 'Unmoderated Caucus', 'Previous Question'],
    answer: 2,
    explain: 'Unmod = informal floor time. Delegates move freely, lobby, negotiate, and draft. Perfect for merging papers.'
  },
  {
    scenario: "Another delegate directly accused your country of violating international law in their speech.",
    q: "What's your next move?",
    opts: ['Point of Order', 'Right of Reply', 'Point of Personal Privilege', 'Motion to Table'],
    answer: 1,
    explain: "Right of Reply is specifically for direct attacks on your country's dignity. Submit written request to the chair immediately."
  },
  {
    scenario: "The speaker has yielded to points of information. You noticed a major flaw in their argument.",
    q: "What do you use?",
    opts: ['Point of Order', 'Motion for Moderated Caucus', 'Point of Information to Speaker', 'Right of Reply'],
    answer: 2,
    explain: 'Point of Information (to speaker) lets you ask a pointed question after they yield — use it to expose weaknesses.'
  },
  {
    scenario: "Motion to Table a Topic is on the floor. How many votes are needed to pass it?",
    q: "Required vote threshold?",
    opts: ['Simple majority (>50%)', 'Two-thirds majority (>66%)', 'Unanimous consent', 'Three-fourths majority'],
    answer: 1,
    explain: 'Tabling is drastic — it suspends a topic for the whole session. High bar: two-thirds majority required.'
  },
  {
    scenario: "The microphone cut out mid-speech. You genuinely cannot hear anything being said.",
    q: "What do you raise?",
    opts: ['Point of Order', 'Parliamentary Inquiry', 'Right of Reply', 'Point of Personal Privilege'],
    answer: 3,
    explain: 'Point of Personal Privilege = physical inability to participate. Technical issues / audio problems qualify.'
  },
  {
    scenario: "Your bloc has the votes. You want to skip the rest of the speakers list and go straight to voting.",
    q: "What motion calls for this?",
    opts: ['Close Speakers List', 'Table Topic', 'Move to Previous Question', 'Motion for Extension'],
    answer: 2,
    explain: 'Move to Previous Question immediately ends debate and forces a vote. High-stakes — requires two-thirds majority.'
  },
  {
    scenario: "You're confused whether a motion needs simple or two-thirds majority. Debate is ongoing.",
    q: "When can you ask the chair about this?",
    opts: ['Interrupt the current speaker', 'Wait for the floor to open', 'During unmod only', 'Only in writing'],
    answer: 1,
    explain: "Parliamentary Inquiry should wait for the floor to open — interrupting speakers for a procedural question is bad form."
  },
  {
    scenario: "The unmoderated caucus is running out and you still need more time to finalize language.",
    q: "What do you motion for?",
    opts: ['Open Speakers List', 'Move to Previous Question', 'Extend Debate', 'Table Topic'],
    answer: 2,
    explain: "Motion to Extend Debate adds more time. State specifically what you'll accomplish — vague extensions rarely pass."
  },
]

/* ── Flashcard scenarios ── */
const FLASHCARDS = PROCEDURE_ITEMS.map(item => ({
  scenario: item.when,
  answer: item.name,
  type: item.type,
  howTo: item.how,
  phrase: item.example,
  tip: item.tip,
}))

export default function ProcedureGuide() {
  const [tab, setTab] = useState<Tab>('reference')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'point' | 'motion'>('all')

  // Flashcard state
  const [cardIdx, setCardIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [cardsDone, setCardsDone] = useState(false)

  // Quiz state
  const [quizIdx, setQuizIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [quizScore, setQuizScore] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [wrong, setWrong] = useState<number[]>([])

  const filteredItems = PROCEDURE_ITEMS.filter(p =>
    filter === 'all' || p.type === filter
  )

  /* ── Flashcard handlers ── */
  const markCard = (hit: boolean) => {
    if (hit) setCorrect(c => c + 1)
    if (cardIdx + 1 >= FLASHCARDS.length) {
      setCardsDone(true)
    } else {
      setCardIdx(i => i + 1)
      setRevealed(false)
    }
  }
  const resetCards = () => { setCardIdx(0); setRevealed(false); setCorrect(0); setCardsDone(false) }

  /* ── Quiz handlers ── */
  const handleAnswer = (i: number) => {
    if (selected !== null) return
    setSelected(i)
    if (i === QUIZ[quizIdx].answer) setQuizScore(s => s + 1)
    else setWrong(w => [...w, quizIdx])
  }
  const handleNext = () => {
    setSelected(null)
    if (quizIdx + 1 >= QUIZ.length) setQuizDone(true)
    else setQuizIdx(q => q + 1)
  }
  const resetQuiz = () => { setQuizIdx(0); setSelected(null); setQuizScore(0); setQuizDone(false); setWrong([]) }

  const q = QUIZ[quizIdx]
  const card = FLASHCARDS[cardIdx]
  const scorePct = Math.round((quizScore / QUIZ.length) * 100)

  const TABS: { id: Tab; label: string; sub: string }[] = [
    { id: 'reference',  label: 'Reference',  sub: `${PROCEDURE_ITEMS.length} items` },
    { id: 'flashcards', label: 'Flashcards', sub: 'Practice mode' },
    { id: 'quiz',       label: 'Quiz',       sub: `${QUIZ.length} questions` },
  ]

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 28px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p className="label" style={{ color: 'var(--blue)', marginBottom: 10 }}>Parliamentary Procedure</p>
        <h1 className="display" style={{ fontSize: 'clamp(2rem,4vw,3rem)', marginBottom: 8 }}>Learn. Practice. Know cold.</h1>
        <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.65, maxWidth: 520 }}>
          Reference every point and motion, drill yourself with flashcards, then test with scenario-based questions.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 36 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 22px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t.id ? 'var(--text)' : 'var(--text2)',
            fontWeight: tab === t.id ? 700 : 500,
            fontSize: 13,
            borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent',
            marginBottom: -1,
            transition: 'all 0.14s',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
            fontFamily: 'Inter, sans-serif',
          }}>
            {t.label}
            <span className="label" style={{ color: tab === t.id ? 'var(--blue)' : 'var(--muted)', letterSpacing: '0.1em' }}>{t.sub}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── REFERENCE ── */}
        {tab === 'reference' && (
          <motion.div key="ref" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* Core rule callout */}
            <div className="card card-cobalt" style={{ padding: '18px 20px', marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div className="label" style={{ color: 'var(--blue)', marginBottom: 8 }}>Points</div>
                <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.65 }}>
                  Raised about procedure or physical issues. Some can interrupt a speaker. No vote required — chair decides.
                </p>
              </div>
              <div>
                <div className="label" style={{ color: 'var(--text2)', marginBottom: 8 }}>Motions</div>
                <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.65 }}>
                  Change what the committee is doing. Require a vote — simple or two-thirds majority depending on the motion.
                </p>
              </div>
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {(['all', 'point', 'motion'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className="btn btn-ghost" style={{
                  padding: '6px 14px', fontSize: 12,
                  background: filter === f ? 'var(--blue-dim)' : 'transparent',
                  borderColor: filter === f ? 'rgba(65,105,255,0.4)' : 'var(--border)',
                  color: filter === f ? 'var(--blue-hi)' : 'var(--text2)',
                }}>
                  {f === 'all' ? 'All' : f === 'point' ? 'Points only' : 'Motions only'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredItems.map(item => (
                <div key={item.name} className="card" style={{ overflow: 'hidden' }}>
                  <button
                    onClick={() => setExpanded(expanded === item.name ? null : item.name)}
                    style={{
                      width: '100%', padding: '15px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'none', border: 'none', cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 3,
                        fontFamily: 'Space Mono, monospace', letterSpacing: '0.07em', textTransform: 'uppercase',
                        background: item.type === 'point' ? 'var(--blue-dim)' : 'rgba(255,255,255,0.05)',
                        color: item.type === 'point' ? 'var(--blue-hi)' : 'var(--text2)',
                        border: `1px solid ${item.type === 'point' ? 'rgba(65,105,255,0.25)' : 'var(--border-hi)'}`,
                      }}>{item.type}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{item.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {item.vote && <span className="label" style={{ color: 'var(--muted)' }}>{item.vote}</span>}
                      <span style={{ color: 'var(--muted)', fontSize: 11, transform: expanded === item.name ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {expanded === item.name && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ borderTop: '1px solid var(--border)', padding: '18px 18px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[['When to use', item.when], ['How to raise it', item.how], ['Requirements', item.requires]].map(([label, val]) => (
                              <div key={label}>
                                <div className="label" style={{ marginBottom: 5 }}>{label}</div>
                                <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.65 }}>{val}</p>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                              <div className="label" style={{ marginBottom: 5 }}>Exact phrasing</div>
                              <div style={{
                                fontFamily: 'Space Mono, monospace', fontSize: 11.5,
                                background: 'rgba(65,105,255,0.05)',
                                border: '1px solid rgba(65,105,255,0.12)',
                                borderRadius: 5, padding: '10px 12px',
                                color: 'var(--text2)', lineHeight: 1.65,
                              }}>{item.example}</div>
                            </div>
                            <div style={{
                              padding: '12px 14px',
                              background: 'rgba(255,255,255,0.025)',
                              border: '1px solid var(--border)',
                              borderRadius: 5,
                            }}>
                              <div className="label" style={{ color: 'var(--blue)', marginBottom: 6 }}>Strategic tip</div>
                              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.65 }}>{item.tip}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── FLASHCARDS ── */}
        {tab === 'flashcards' && (
          <motion.div key="flash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ maxWidth: 680, margin: '0 auto' }}
          >
            {!cardsDone ? (
              <>
                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="label">{cardIdx + 1} / {FLASHCARDS.length}</span>
                  <span className="label" style={{ color: 'var(--blue)' }}>{correct} known</span>
                </div>
                <div className="prog-track" style={{ height: 3, marginBottom: 28 }}>
                  <div className="prog-fill" style={{ width: `${((cardIdx) / FLASHCARDS.length) * 100}%` }} />
                </div>

                {/* Card */}
                <AnimatePresence mode="wait">
                  <motion.div key={cardIdx}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.22 }}
                  >
                    {/* Scenario */}
                    <div className="card" style={{ padding: '28px 28px 24px', marginBottom: 12, borderTop: '1px solid rgba(65,105,255,0.35)' }}>
                      <div className="label" style={{ color: 'var(--blue)', marginBottom: 14 }}>Situation in committee</div>
                      <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.7, fontWeight: 400 }}>
                        {card.scenario}
                      </p>
                      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                        {!revealed ? (
                          <button onClick={() => setRevealed(true)} className="btn btn-primary" style={{ padding: '10px 22px', fontSize: 13 }}>
                            Reveal answer →
                          </button>
                        ) : (
                          <span className="label" style={{ color: 'var(--text2)', alignSelf: 'center' }}>↓ Correct answer below</span>
                        )}
                      </div>
                    </div>

                    {/* Answer */}
                    <AnimatePresence>
                      {revealed && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className="card"
                          style={{ padding: '22px 28px', marginBottom: 16 }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <span style={{
                              fontSize: 9.5, fontWeight: 700, padding: '3px 9px', borderRadius: 3,
                              fontFamily: 'Space Mono, monospace', letterSpacing: '0.07em', textTransform: 'uppercase',
                              background: card.type === 'point' ? 'var(--blue-dim)' : 'rgba(255,255,255,0.05)',
                              color: card.type === 'point' ? 'var(--blue-hi)' : 'var(--text2)',
                              border: `1px solid ${card.type === 'point' ? 'rgba(65,105,255,0.25)' : 'var(--border-hi)'}`,
                            }}>{card.type}</span>
                            <span className="display" style={{ fontSize: 20 }}>{card.answer}</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                              <div className="label" style={{ marginBottom: 5 }}>How to raise it</div>
                              <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.65 }}>{card.howTo}</p>
                            </div>
                            <div>
                              <div className="label" style={{ marginBottom: 5 }}>Say this</div>
                              <div style={{
                                fontFamily: 'Space Mono, monospace', fontSize: 11,
                                background: 'rgba(65,105,255,0.05)',
                                border: '1px solid rgba(65,105,255,0.12)',
                                borderRadius: 5, padding: '9px 12px',
                                color: 'var(--text2)', lineHeight: 1.65,
                              }}>{card.phrase}</div>
                            </div>
                            <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.025)', borderRadius: 5, border: '1px solid var(--border)' }}>
                              <span style={{ fontSize: 11.5, color: 'var(--text2)', lineHeight: 1.6 }}>💡 {card.tip}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Mark buttons */}
                    {revealed && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => markCard(false)} className="btn btn-ghost" style={{ flex: 1, padding: '11px 0' }}>
                          Still learning
                        </button>
                        <button onClick={() => markCard(true)} className="btn btn-primary" style={{ flex: 1, padding: '11px 0' }}>
                          Got it ✓
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="card card-blue" style={{ padding: '48px 36px', textAlign: 'center' }}
              >
                <div className="display" style={{ fontSize: 56, color: 'var(--blue)', marginBottom: 8 }}>
                  {correct}/{FLASHCARDS.length}
                </div>
                <p className="label" style={{ color: 'var(--blue)', marginBottom: 16 }}>Known on first pass</p>
                <h2 className="display" style={{ fontSize: '1.8rem', marginBottom: 10 }}>
                  {correct >= FLASHCARDS.length * 0.85 ? 'Procedure mastered.' :
                   correct >= FLASHCARDS.length * 0.6  ? 'Almost there.' : 'Keep drilling.'}
                </h2>
                <p style={{ fontSize: 13.5, color: 'var(--text2)', marginBottom: 28, lineHeight: 1.65 }}>
                  {correct >= FLASHCARDS.length * 0.85
                    ? 'You know your procedure cold. Other delegates will ask you for guidance in committee.'
                    : `Review the Reference tab for the ${FLASHCARDS.length - correct} you missed, then run the cards again.`}
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button onClick={resetCards} className="btn btn-primary" style={{ padding: '11px 28px' }}>Run Again</button>
                  <button onClick={() => setTab('quiz')} className="btn btn-ghost" style={{ padding: '11px 24px' }}>Take Quiz →</button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── QUIZ ── */}
        {tab === 'quiz' && (
          <motion.div key="quiz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ maxWidth: 680, margin: '0 auto' }}
          >
            {!quizDone ? (
              <>
                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="label">Question {quizIdx + 1} of {QUIZ.length}</span>
                  <span className="label" style={{ color: 'var(--blue)' }}>{quizScore} correct</span>
                </div>
                <div className="prog-track" style={{ height: 3, marginBottom: 28 }}>
                  <div className="prog-fill" style={{ width: `${(quizIdx / QUIZ.length) * 100}%`, transition: 'width 0.4s ease' }} />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={quizIdx}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                  >
                    {/* Scenario */}
                    <div className="card" style={{ padding: '20px 22px', marginBottom: 14, background: 'var(--surface2)', borderLeft: '2px solid rgba(65,105,255,0.35)' }}>
                      <div className="label" style={{ color: 'var(--blue)', marginBottom: 8 }}>Scenario</div>
                      <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.68 }}>{q.scenario}</p>
                    </div>

                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16, letterSpacing: '-0.02em' }}>{q.q}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                      {q.opts.map((opt, i) => {
                        const done = selected !== null
                        const isRight = i === q.answer
                        const isPicked = selected === i
                        let bg = 'transparent', borderColor = 'var(--border)', color = 'var(--text2)'
                        if (done && isRight)              { bg = 'rgba(65,105,255,0.1)'; borderColor = 'rgba(65,105,255,0.5)'; color = 'var(--blue-hi)' }
                        else if (done && isPicked && !isRight) { bg = 'rgba(255,60,60,0.08)'; borderColor = 'rgba(255,60,60,0.35)'; color = '#ff7070' }
                        else if (!done)                   { bg = 'transparent'; borderColor = 'var(--border)'; color = 'var(--text)' }
                        else                              { color = 'var(--muted)' }
                        return (
                          <motion.button key={i}
                            whileHover={!done ? { x: 3 } : {}}
                            onClick={() => handleAnswer(i)}
                            style={{
                              width: '100%', textAlign: 'left', padding: '13px 16px',
                              border: `1px solid ${borderColor}`, borderRadius: 7,
                              background: bg, color, cursor: done ? 'default' : 'pointer',
                              fontFamily: 'Inter, sans-serif', fontSize: 13.5, fontWeight: 500,
                              transition: 'all 0.14s', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}
                          >
                            <span>
                              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, opacity: 0.5, marginRight: 10 }}>
                                {String.fromCharCode(65 + i)}.
                              </span>
                              {opt}
                            </span>
                            {done && isRight  && <span style={{ fontSize: 13, color: 'var(--blue-hi)' }}>✓</span>}
                            {done && isPicked && !isRight && <span style={{ fontSize: 13, color: '#ff7070' }}>✗</span>}
                          </motion.button>
                        )
                      })}
                    </div>

                    <AnimatePresence>
                      {selected !== null && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          style={{
                            padding: '14px 16px', borderRadius: 7, marginBottom: 14,
                            background: selected === q.answer ? 'rgba(65,105,255,0.07)' : 'rgba(255,60,60,0.06)',
                            border: `1px solid ${selected === q.answer ? 'rgba(65,105,255,0.2)' : 'rgba(255,60,60,0.2)'}`,
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5, color: selected === q.answer ? 'var(--blue-hi)' : '#ff7070' }}>
                            {selected === q.answer ? '✓ Correct' : '✗ Not quite'}
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{q.explain}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {selected !== null && (
                      <button onClick={handleNext} className="btn btn-primary" style={{ width: '100%', padding: '12px 0', fontSize: 13 }}>
                        {quizIdx + 1 < QUIZ.length ? 'Next Question →' : 'See Results →'}
                      </button>
                    )}
                  </motion.div>
                </AnimatePresence>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="card card-blue" style={{ padding: '44px 36px', textAlign: 'center' }}
              >
                <div className="display" style={{ fontSize: 64, color: scorePct >= 80 ? 'var(--blue-hi)' : scorePct >= 60 ? 'var(--text)' : 'var(--text2)', marginBottom: 6 }}>
                  {quizScore}<span style={{ fontSize: 28, opacity: 0.4 }}>/{QUIZ.length}</span>
                </div>
                <h2 className="display" style={{ fontSize: '1.7rem', marginBottom: 10 }}>
                  {scorePct >= 90 ? 'Procedure mastered.' :
                   scorePct >= 70 ? 'Solid foundation.' :
                   scorePct >= 50 ? 'Getting there.' : 'Keep studying.'}
                </h2>
                <p style={{ fontSize: 13.5, color: 'var(--text2)', marginBottom: wrong.length > 0 ? 28 : 32, lineHeight: 1.65 }}>
                  {scorePct >= 90 ? 'You clearly know your procedure — other delegates will come to you.' :
                   scorePct >= 70 ? 'Good foundation. Review the items you missed, then retake.' :
                   'Read through the Reference and Flashcard tabs, then try again.'}
                </p>

                {wrong.length > 0 && (
                  <div style={{ textAlign: 'left', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '18px 20px', marginBottom: 24 }}>
                    <div className="label" style={{ color: '#ff7070', marginBottom: 14 }}>Review these</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {wrong.map(i => (
                        <div key={i} style={{ borderLeft: '2px solid rgba(255,60,60,0.3)', paddingLeft: 14 }}>
                          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4, lineHeight: 1.55 }}>{QUIZ[i].scenario}</p>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue-hi)', marginBottom: 3 }}>✓ {QUIZ[i].opts[QUIZ[i].answer]}</p>
                          <p style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.55 }}>{QUIZ[i].explain}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={resetQuiz} className="btn btn-primary" style={{ flex: 1, padding: '11px 0' }}>Retake Quiz</button>
                  <button onClick={() => setTab('reference')} className="btn btn-ghost" style={{ flex: 1, padding: '11px 0' }}>Review Guide</button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
