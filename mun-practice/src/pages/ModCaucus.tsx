import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { COUNTRIES, COMMITTEES } from '../data/munData'
import { generateTalkingPoints, getVotingIntent, type VotingIntent } from '../utils/munGenerator'
import { analyzeSpeech, type SpeechScore } from '../utils/speechAnalyzer'
import SpeechFeedback from '../components/SpeechFeedback'

type Phase = 'setup' | 'your-turn' | 'them-speaking' | 'results'

const SPEAK_TIMES = [30, 60, 90, 120]

interface OtherDelegate {
  country: typeof COUNTRIES[0]
  talkingPoints: string[]
  votingIntent: VotingIntent
}

const intentLabel: Record<VotingIntent, { text: string; color: string; bg: string }> = {
  support: { text: 'Likely to Support', color: '#2dd4bf', bg: 'rgba(20,184,166,0.1)' },
  abstain: { text: 'May Abstain', color: '#e8b84d', bg: 'rgba(201,151,58,0.1)' },
  oppose: { text: 'Likely to Oppose', color: '#fb7185', bg: 'rgba(244,63,94,0.1)' },
}

export default function ModCaucus() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [yourCountry, setYourCountry] = useState(COUNTRIES[0])
  const [committee, setCommittee] = useState(COMMITTEES[0])
  const [topic, setTopic] = useState('')
  const [speakTime, setSpeakTime] = useState(60)
  const [selectedOthers, setSelectedOthers] = useState<typeof COUNTRIES>([])
  const [speech, setSpeech] = useState('')
  const [score, setScore] = useState<SpeechScore | null>(null)
  const [delegates, setDelegates] = useState<OtherDelegate[]>([])
  const [currentDelegateIdx, setCurrentDelegateIdx] = useState(0)
  const [timer, setTimer] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null)
  const [round, setRound] = useState(1)

  const availableOthers = COUNTRIES.filter(c => c.name !== yourCountry.name)

  const toggleCountry = (c: typeof COUNTRIES[0]) => {
    setSelectedOthers(prev =>
      prev.find(p => p.name === c.name)
        ? prev.filter(p => p.name !== c.name)
        : prev.length < 5 ? [...prev, c] : prev
    )
  }

  const autoSelect = () => {
    const shuffled = [...availableOthers].sort(() => Math.random() - 0.5)
    setSelectedOthers(shuffled.slice(0, 4))
  }

  const startCaucus = () => {
    const built: OtherDelegate[] = selectedOthers.map(c => ({
      country: c,
      talkingPoints: generateTalkingPoints(c, topic),
      votingIntent: getVotingIntent(c, yourCountry),
    }))
    setDelegates(built)
    setSpeech('')
    setScore(null)
    setCurrentDelegateIdx(0)
    setTimer(speakTime)
    setTimerRunning(false)
    setPhase('your-turn')
  }

  const startTimer = () => {
    setTimerRunning(true)
    const id = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(id); setTimerRunning(false); return 0 }
        return t - 1
      })
    }, 1000)
    setIntervalId(id)
  }

  const stopTimer = () => {
    setTimerRunning(false)
    if (intervalId) clearInterval(intervalId)
  }

  const resetTimer = () => {
    stopTimer()
    setTimer(speakTime)
  }

  const submitSpeech = () => {
    const result = analyzeSpeech(speech, speakTime, yourCountry.name)
    setScore(result)
  }

  const moveToNextDelegate = () => {
    setScore(null)
    setSpeech('')
    if (currentDelegateIdx >= delegates.length - 1) {
      setPhase('results')
    } else {
      setCurrentDelegateIdx(i => i + 1)
      setPhase('them-speaking')
    }
  }

  const startNewRound = () => {
    const built: OtherDelegate[] = selectedOthers.map(c => ({
      country: c,
      talkingPoints: generateTalkingPoints(c, topic),
      votingIntent: getVotingIntent(c, yourCountry),
    }))
    setDelegates(built)
    setSpeech('')
    setScore(null)
    setCurrentDelegateIdx(0)
    setTimer(speakTime)
    setTimerRunning(false)
    setRound(r => r + 1)
    setPhase('your-turn')
  }

  const words = speech.trim().split(/\s+/).filter(Boolean).length
  const expectedWords = Math.round((speakTime / 60) * 120)
  const wordPct = Math.min((words / expectedWords) * 100, 110)

  const timerPct = timer / speakTime
  const timerColor = timerPct > 0.5 ? '#2dd4bf' : timerPct > 0.25 ? '#e8b84d' : '#fb7185'
  const timerMins = Math.floor(timer / 60)
  const timerSecs = timer % 60

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="accent-line-gold" />
        <h1 className="display text-white" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
          Moderated Caucus
        </h1>
        <p style={{ color: '#7d8597', fontSize: 13, marginTop: 4 }}>
          You speak first. Hear each delegation's stance, then respond in the next round.
        </p>
      </div>

      <AnimatePresence mode="wait">

        {/* ── SETUP ── */}
        {phase === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Left col */}
            <div className="space-y-4">
              {/* Your country */}
              <div className="card p-5">
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7d8597', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                  Your Country
                </label>
                <select value={yourCountry.name}
                  onChange={e => setYourCountry(COUNTRIES.find(c => c.name === e.target.value)!)}
                  className="w-full px-3 py-2.5 text-sm"
                  style={{ background: '#12111d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#dde1ed' }}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                  ))}
                </select>
                <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(61,90,241,0.07)', border: '1px solid rgba(61,90,241,0.12)' }}>
                  <p style={{ fontSize: 12, color: '#93a9ff', lineHeight: 1.6 }}>{yourCountry.position}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {yourCountry.keywords.map(k => (
                      <span key={k} className="badge badge-cobalt" style={{ fontSize: 10 }}>{k}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Committee + topic */}
              <div className="card p-5">
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7d8597', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                  Committee
                </label>
                <select value={committee.name}
                  onChange={e => setCommittee(COMMITTEES.find(c => c.name === e.target.value)!)}
                  className="w-full px-3 py-2.5 text-sm mb-4"
                  style={{ background: '#12111d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#dde1ed' }}
                >
                  {COMMITTEES.map(c => (
                    <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                  ))}
                </select>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7d8597', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Topic
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {committee.topics.map(t => (
                    <button key={t} onClick={() => setTopic(t)}
                      style={{
                        fontSize: 11, padding: '5px 10px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
                        background: topic === t ? 'rgba(201,151,58,0.12)' : 'transparent',
                        border: topic === t ? '1px solid rgba(201,151,58,0.3)' : '1px solid rgba(255,255,255,0.07)',
                        color: topic === t ? '#e8b84d' : '#7d8597',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
                <input value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="Or type a custom topic..."
                  className="w-full px-3 py-2.5 text-sm"
                  style={{ background: '#12111d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#dde1ed' }}
                />
              </div>

              {/* Speaking time */}
              <div className="card p-5">
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7d8597', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                  Your Speaking Time
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {SPEAK_TIMES.map(t => (
                    <button key={t} onClick={() => setSpeakTime(t)}
                      style={{
                        padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                        background: speakTime === t ? '#c9973a' : '#12111d',
                        border: speakTime === t ? '1px solid #c9973a' : '1px solid rgba(255,255,255,0.08)',
                        color: speakTime === t ? '#08080f' : '#7d8597',
                      }}>
                      {t}s
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#44404f', marginTop: 8 }}>Target ~{expectedWords} words</p>
              </div>
            </div>

            {/* Right col — pick other countries */}
            <div className="space-y-4">
              <div className="card p-5" style={{ height: 'fit-content' }}>
                <div className="flex items-center justify-between mb-3">
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#7d8597', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Other Delegates ({selectedOthers.length}/5)
                  </label>
                  <button onClick={autoSelect} className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}>
                    ✦ Auto-Select 4
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#44404f', marginBottom: 12 }}>
                  Choose up to 5 countries. Their positions on the topic will be generated automatically.
                </p>
                <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto pr-1">
                  {availableOthers.map(c => {
                    const isSelected = !!selectedOthers.find(s => s.name === c.name)
                    return (
                      <button key={c.name} onClick={() => toggleCountry(c)}
                        className={`country-pill ${isSelected ? 'selected' : ''}`}>
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                        {isSelected && <span style={{ color: '#c9973a', fontSize: 10 }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedOthers.length > 0 && (
                <div className="card p-4" style={{ borderTop: '2px solid #c9973a' }}>
                  <p style={{ fontSize: 12, color: '#7d8597', marginBottom: 8 }}>Selected delegates:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedOthers.map(c => (
                      <span key={c.name} className="badge badge-gold">
                        {c.flag} {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={startCaucus}
                disabled={!topic.trim() || selectedOthers.length === 0}
                className="btn-gold w-full" style={{ padding: '14px 0', fontSize: 15 }}>
                {!topic.trim() ? 'Select a topic first' :
                 selectedOthers.length === 0 ? 'Pick at least 1 other country' :
                 `Begin Caucus — ${selectedOthers.length + 1} delegates →`}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── YOUR TURN ── */}
        {phase === 'your-turn' && (
          <motion.div key="your-turn" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Header */}
            <div className="card p-4 mb-5" style={{ borderTop: '3px solid #e8b84d', background: 'rgba(232,184,77,0.05)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 32 }}>{yourCountry.flag}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#e8b84d' }}>
                      {yourCountry.name} — It's your turn to speak
                    </div>
                    <div style={{ fontSize: 12, color: '#7d8597' }}>
                      {committee.name} · {topic} · Round {round}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: '#7d8597' }}>
                  <span>Speaker 1 of {delegates.length + 1}</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {/* Speech editor */}
              <div className="md:col-span-2 space-y-3">
                {!score ? (
                  <>
                    <div className="card" style={{ padding: 2 }}>
                      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#7d8597' }}>Write your speech</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
                          color: wordPct > 105 ? '#fb7185' : wordPct > 75 ? '#2dd4bf' : '#44404f'
                        }}>
                          {words}/{expectedWords}w
                        </span>
                      </div>
                      <textarea value={speech} onChange={e => setSpeech(e.target.value)}
                        className="w-full" autoFocus
                        style={{
                          background: 'transparent', border: 'none', padding: '14px', color: '#dde1ed',
                          fontSize: 14, lineHeight: 1.7, minHeight: 320,
                        }}
                        placeholder={`Honorable Chair, distinguished delegates,\n\nThe delegation of ${yourCountry.name} would like to address the committee regarding ${topic}...\n\n[Aim for ~${expectedWords} words. Use diplomatic language, cite evidence, and close with a specific proposal.]`}
                      />
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                      <div className="score-bar-fill"
                        style={{ width: `${Math.min(wordPct, 100)}%`, background: wordPct > 105 ? '#fb7185' : wordPct > 75 ? '#2dd4bf' : '#3d5af1' }} />
                    </div>
                    <button onClick={submitSpeech} disabled={words < 10}
                      className="btn-gold w-full" style={{ padding: '13px 0', fontSize: 15 }}>
                      Submit for Scoring →
                    </button>
                  </>
                ) : (
                  <div>
                    <SpeechFeedback score={score} onRetry={() => { setSpeech(''); setScore(null) }} />
                    <button onClick={moveToNextDelegate} className="btn-cobalt w-full mt-4" style={{ padding: '13px 0' }}>
                      {currentDelegateIdx >= delegates.length - 1 ? 'Finish Caucus →' : `Hear ${delegates[currentDelegateIdx]?.country.name || 'next delegate'}'s speech →`}
                    </button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Timer */}
                <div className="card p-5 text-center">
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#7d8597', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Timer</p>
                  <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 12px' }}>
                    <svg viewBox="0 0 90 90" style={{ width: '100%', height: '100%' }}>
                      <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                      <circle cx="45" cy="45" r="38" fill="none" stroke={timerColor} strokeWidth="6"
                        strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 38}`}
                        strokeDashoffset={`${2 * Math.PI * 38 * (1 - timerPct)}`}
                        transform="rotate(-90 45 45)"
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s' }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: timerColor, fontFamily: 'monospace' }}>
                        {timerMins > 0 ? `${timerMins}:${timerSecs.toString().padStart(2,'0')}` : timerSecs}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-center">
                    {!timerRunning ? (
                      <button onClick={startTimer} className="btn-gold" style={{ padding: '7px 18px', fontSize: 13 }}>
                        {timer === speakTime ? 'Start' : 'Resume'}
                      </button>
                    ) : (
                      <button onClick={stopTimer} className="btn-cobalt" style={{ padding: '7px 18px', fontSize: 13 }}>Pause</button>
                    )}
                    <button onClick={resetTimer} className="btn-ghost" style={{ padding: '7px 14px', fontSize: 13 }}>↺</button>
                  </div>
                  {timer === 0 && (
                    <p style={{ fontSize: 12, color: '#fb7185', marginTop: 8, fontWeight: 600 }}>⚠ Time's up!</p>
                  )}
                </div>

                {/* Quick reference */}
                <div className="card p-4 card-cobalt">
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#6b84f5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Quick Ref</p>
                  {['Honorable Chair, distinguished delegates,', `The delegation of ${yourCountry.name}...`, 'calls upon · reaffirms · notes with concern', 'strongly urges · emphasizes', '...yields the floor.'].map((p, i) => (
                    <div key={i} style={{ fontSize: 11, fontFamily: 'monospace', color: '#93a9ff', padding: '5px 8px', background: 'rgba(61,90,241,0.06)', borderRadius: 6, marginBottom: 4 }}>
                      {p}
                    </div>
                  ))}
                </div>

                {/* Upcoming speakers */}
                <div className="card p-4">
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#7d8597', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Speakers List</p>
                  <div style={{ fontSize: 12, color: '#e8b84d', fontWeight: 600, padding: '6px 10px', background: 'rgba(232,184,77,0.08)', borderRadius: 8, marginBottom: 4 }}>
                    {yourCountry.flag} {yourCountry.name} ← You (speaking now)
                  </div>
                  {delegates.map((d, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#7d8597', padding: '5px 10px' }}>
                      {d.country.flag} {d.country.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── THEM SPEAKING ── */}
        {phase === 'them-speaking' && delegates[currentDelegateIdx] && (
          <motion.div key={`them-${currentDelegateIdx}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid md:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-4">
                {/* Speaker card */}
                <div className="card p-6" style={{ borderTop: '3px solid #3d5af1' }}>
                  <div className="flex items-start gap-4 mb-5">
                    <span style={{ fontSize: 48, lineHeight: 1 }}>{delegates[currentDelegateIdx].country.flag}</span>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#dde1ed' }}>
                        {delegates[currentDelegateIdx].country.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#7d8597', marginTop: 2 }}>
                        {committee.name} · Delegate {currentDelegateIdx + 2} of {delegates.length + 1}
                      </div>
                      <div className="mt-2" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
                        borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: intentLabel[delegates[currentDelegateIdx].votingIntent].bg,
                        color: intentLabel[delegates[currentDelegateIdx].votingIntent].color,
                      }}>
                        {delegates[currentDelegateIdx].votingIntent === 'support' ? '▲' : delegates[currentDelegateIdx].votingIntent === 'oppose' ? '▼' : '→'}
                        {' '}{intentLabel[delegates[currentDelegateIdx].votingIntent].text}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, fontWeight: 700, color: '#7d8597', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                    Their key points on {topic}
                  </p>
                  <div>
                    {delegates[currentDelegateIdx].talkingPoints.map((pt, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }} className="stance-point">
                        <span style={{ color: '#3d5af1', fontWeight: 700, fontSize: 12, minWidth: 18 }}>{i + 1}.</span>
                        <span style={{ fontSize: 13 }}>{pt}.</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Note-taking area */}
                <div className="card p-5">
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#7d8597', marginBottom: 8 }}>
                    Take notes — what will you say in response? How will you reference this speech in your next turn?
                  </p>
                  <textarea placeholder="Your reaction notes, potential rebuttals, or alliance considerations..."
                    className="w-full" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', color: '#dde1ed', fontSize: 13, lineHeight: 1.6, minHeight: 100 }} />
                </div>

                <div className="flex gap-3">
                  <button onClick={moveToNextDelegate} className="btn-gold flex-1" style={{ padding: '13px 0' }}>
                    {currentDelegateIdx >= delegates.length - 1 ? 'Finish Caucus →' : `Next: ${delegates[currentDelegateIdx + 1]?.country.name || 'next delegate'} →`}
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="card p-4">
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#7d8597', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Speakers Progress</p>
                  <div style={{ fontSize: 12, color: '#2dd4bf', padding: '6px 10px', background: 'rgba(45,212,191,0.07)', borderRadius: 8, marginBottom: 4 }}>
                    ✓ {yourCountry.flag} {yourCountry.name} (you spoke)
                  </div>
                  {delegates.map((d, i) => (
                    <div key={i} style={{
                      fontSize: 12, padding: '5px 10px', borderRadius: 8, marginBottom: 3,
                      color: i === currentDelegateIdx ? '#dde1ed' : i < currentDelegateIdx ? '#2dd4bf' : '#7d8597',
                      background: i === currentDelegateIdx ? 'rgba(61,90,241,0.08)' : 'transparent',
                      fontWeight: i === currentDelegateIdx ? 600 : 400,
                    }}>
                      {i < currentDelegateIdx ? '✓ ' : i === currentDelegateIdx ? '▶ ' : ''}{d.country.flag} {d.country.name}
                    </div>
                  ))}
                </div>

                <div className="card p-4 card-gold">
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#e8b84d', marginBottom: 8 }}>While listening</p>
                  <p style={{ fontSize: 12, color: '#7d8597', lineHeight: 1.6 }}>
                    Note which of their talking points you agree/disagree with. In your next speech, reference them: "Building on what the delegate of {delegates[currentDelegateIdx]?.country.name} said regarding..."
                  </p>
                </div>

                <div className="card p-4">
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#7d8597', marginBottom: 6 }}>Their country position</p>
                  <p style={{ fontSize: 12, color: '#93a9ff', lineHeight: 1.5 }}>
                    {delegates[currentDelegateIdx]?.country.position}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── RESULTS ── */}
        {phase === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="card p-8 text-center" style={{ borderTop: '3px solid #c9973a' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <h2 className="display text-white mb-2" style={{ fontSize: '1.8rem' }}>Caucus Complete</h2>
              <p style={{ color: '#7d8597', fontSize: 13, marginBottom: 20 }}>
                Round {round} done. You heard all {delegates.length} delegates and gave your speech.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  ['Your score', score ? `${score.total}/100` : '—'],
                  ['Badge', score?.badge?.split(' ').slice(0, 2).join(' ') || '—'],
                  ['Delegates heard', delegates.length.toString()],
                ].map(([l, v]) => (
                  <div key={l} className="card p-3">
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#dde1ed' }}>{v}</div>
                    <div style={{ fontSize: 11, color: '#7d8597', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>

              {score && (
                <div className="card p-4 text-left mb-5" style={{ borderLeft: '3px solid #c9973a' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#e8b84d', marginBottom: 6 }}>Your Speech Score: {score.badge} {score.badgeEmoji}</p>
                  <p style={{ fontSize: 12, color: '#7d8597' }}>
                    {score.total >= 75
                      ? `Strong performance! Focus on: ${score.generalTips[0] || 'keep refining your diplomatic language'}`
                      : `Key area to improve: ${score.generalTips[0] || 'practice using diplomatic language phrases consistently'}`}
                  </p>
                </div>
              )}

              <div className="card p-4 text-left mb-5">
                <p style={{ fontSize: 12, fontWeight: 700, color: '#7d8597', marginBottom: 8 }}>Delegates you heard:</p>
                {delegates.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < delegates.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span>{d.country.flag}</span>
                    <span style={{ fontSize: 13, color: '#dde1ed', flex: 1 }}>{d.country.name}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                      background: intentLabel[d.votingIntent].bg, color: intentLabel[d.votingIntent].color,
                    }}>
                      {intentLabel[d.votingIntent].text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={startNewRound} className="btn-gold flex-1" style={{ padding: '12px 0' }}>
                  New Round (Round {round + 1})
                </button>
                <button onClick={() => setPhase('setup')} className="btn-ghost flex-1">
                  Change Setup
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
