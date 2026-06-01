import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Timer from '../components/Timer'
import SpeechFeedback from '../components/SpeechFeedback'
import { COUNTRIES, COMMITTEES } from '../data/munData'
import { analyzeSpeech, type SpeechScore } from '../utils/speechAnalyzer'

type Step = 'setup' | 'write' | 'results'

const TIME_OPTIONS = [
  { label: '30 sec', value: 30 },
  { label: '1 min', value: 60 },
  { label: '90 sec', value: 90 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
]

export default function SpeechPractice() {
  const [step, setStep] = useState<Step>('setup')
  const [country, setCountry] = useState(COUNTRIES[0].name)
  const [committee, setCommittee] = useState(COMMITTEES[0].name)
  const [topic, setTopic] = useState('')
  const [timeLimit, setTimeLimit] = useState(60)
  const [speech, setSpeech] = useState('')
  const [score, setScore] = useState<SpeechScore | null>(null)
  const [showPosition, setShowPosition] = useState(false)

  const selectedCountry = COUNTRIES.find(c => c.name === country)!
  const selectedCommittee = COMMITTEES.find(c => c.name === committee)!

  const handleStart = () => {
    setSpeech('')
    setStep('write')
  }

  const handleSubmit = () => {
    if (!speech.trim()) return
    const result = analyzeSpeech(speech, timeLimit, country)
    setScore(result)
    setStep('results')
  }

  const handleRetry = () => {
    setSpeech('')
    setScore(null)
    setStep('setup')
  }

  const wordCount = speech.trim().split(/\s+/).filter(w => w.length > 0).length
  const expectedWords = Math.round((timeLimit / 60) * 120)
  const wordPct = Math.min((wordCount / expectedWords) * 100, 110)

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-white mb-1">Speech Practice</h1>
        <p className="text-gray-500 text-sm">Write and time your position statement. Get scored like a real MUN judge.</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {(['setup', 'write', 'results'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
              step === s ? 'bg-blue-600 border-blue-500 text-white' :
              i < ['setup','write','results'].indexOf(step) ? 'bg-green-600 border-green-500 text-white' :
              'border-white/10 text-gray-600'
            }`}>
              {i < ['setup','write','results'].indexOf(step) ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium capitalize ${step === s ? 'text-white' : 'text-gray-600'}`}>
              {s === 'setup' ? 'Setup' : s === 'write' ? 'Write & Time' : 'Feedback'}
            </span>
            {i < 2 && <div className="w-8 h-px bg-white/10" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* STEP 1: Setup */}
        {step === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <div className="space-y-5">
              {/* Country */}
              <div className="glass rounded-xl p-5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Country</label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.name} value={c.name} className="bg-navy-900">{c.flag} {c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowPosition(!showPosition)}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showPosition ? '▲ Hide' : '▼ Show'} {country}'s position brief
                </button>
                <AnimatePresence>
                  {showPosition && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-gray-300 leading-relaxed">{selectedCountry.position}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {selectedCountry.keywords.map(k => (
                            <span key={k} className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">{k}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Committee */}
              <div className="glass rounded-xl p-5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Committee</label>
                <select
                  value={committee}
                  onChange={e => setCommittee(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
                >
                  {COMMITTEES.map(c => (
                    <option key={c.name} value={c.name} className="bg-navy-900">{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div className="glass rounded-xl p-5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Topic</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedCommittee.topics.map(t => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        topic === t
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Or type a custom topic..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none placeholder-gray-600"
                />
              </div>
            </div>

            <div className="space-y-5">
              {/* Time limit */}
              <div className="glass rounded-xl p-5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Speaking Time</label>
                <div className="grid grid-cols-5 gap-2">
                  {TIME_OPTIONS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTimeLimit(t.value)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        timeLimit === t.value
                          ? 'bg-gold-400 border-gold-400 text-navy-900'
                          : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Target ~{expectedWords} words at a natural speaking pace
                </p>
              </div>

              {/* Tips */}
              <div className="glass rounded-xl p-5 border border-gold-400/20">
                <h3 className="text-sm font-semibold text-gold-400 mb-3">Before You Write</h3>
                <ul className="space-y-2 text-xs text-gray-400">
                  <li className="flex gap-2"><span className="text-gold-400">1.</span> Open with "Honorable Chair, distinguished delegates,"</li>
                  <li className="flex gap-2"><span className="text-gold-400">2.</span> State {country}'s position on {topic || 'this topic'} in your first sentence</li>
                  <li className="flex gap-2"><span className="text-gold-400">3.</span> Include at least one specific statistic or treaty reference</li>
                  <li className="flex gap-2"><span className="text-gold-400">4.</span> Use diplomatic phrases: "calls upon," "reaffirms," "notes with concern"</li>
                  <li className="flex gap-2"><span className="text-gold-400">5.</span> End with a specific proposal and "yields the floor"</li>
                </ul>
              </div>

              <button
                onClick={handleStart}
                disabled={!topic.trim()}
                className="btn-gold w-full py-3.5 text-base disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {topic.trim() ? 'Start Writing →' : 'Select a topic to continue'}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Write */}
        {step === 'write' && (
          <motion.div key="write" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {/* Speech editor — takes 2/3 */}
            <div className="md:col-span-2 space-y-4">
              <div className="glass rounded-xl p-2">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-1">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium text-white">{selectedCountry.flag} {country}</span>
                    {' · '}{selectedCommittee.icon} {committee}
                    {' · '}<span className="text-gray-400">{topic}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${
                    wordPct > 100 ? 'text-red-400' : wordPct > 75 ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {wordCount}/{expectedWords}w
                  </span>
                </div>
                <textarea
                  value={speech}
                  onChange={e => setSpeech(e.target.value)}
                  className="w-full bg-transparent text-white text-sm leading-relaxed p-4 min-h-[400px] focus:outline-none placeholder-gray-700"
                  placeholder={`Honorable Chair, distinguished delegates,\n\nThe delegation of ${country} would like to address the committee on ${topic}...\n\n[Your speech here — aim for ~${expectedWords} words]`}
                  autoFocus
                />
              </div>

              {/* Word count bar */}
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    wordPct > 105 ? 'bg-red-500' : wordPct > 80 ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(wordPct, 100)}%` }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={wordCount < 10}
                className="btn-gold w-full py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit for Scoring →
              </button>
            </div>

            {/* Timer + reference — 1/3 */}
            <div className="space-y-4">
              <div className="glass rounded-xl p-5 text-center">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Speech Timer</h3>
                <Timer totalSeconds={timeLimit} />
              </div>

              <div className="glass rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Reference</h3>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="p-2 bg-white/5 rounded-lg font-mono">Honorable Chair, distinguished delegates,</div>
                  <div className="p-2 bg-white/5 rounded-lg font-mono">The delegation of {country}...</div>
                  <div className="p-2 bg-white/5 rounded-lg font-mono">calls upon · reaffirms · notes with concern</div>
                  <div className="p-2 bg-white/5 rounded-lg font-mono">strongly urges · emphasizes · welcomes</div>
                  <div className="p-2 bg-white/5 rounded-lg font-mono">...yields the floor.</div>
                </div>
              </div>

              <div className="glass rounded-xl p-4 border border-blue-500/20">
                <h3 className="text-xs font-semibold text-blue-400 mb-2">{country}'s Keywords</h3>
                <div className="flex flex-wrap gap-1">
                  {selectedCountry.keywords.map(k => (
                    <span key={k} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{k}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep('setup')}
                className="w-full text-sm py-2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Change setup
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Results */}
        {step === 'results' && score && (
          <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Your Speech</h3>
              <div className="glass rounded-xl p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                {speech}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Your Score</h3>
              <SpeechFeedback score={score} onRetry={handleRetry} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
