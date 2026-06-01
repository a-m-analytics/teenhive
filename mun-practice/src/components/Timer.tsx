import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  totalSeconds: number
  onComplete?: (elapsed: number) => void
  autoStart?: boolean
}

const SIZE = 120
const STROKE = 8
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R

export default function Timer({ totalSeconds, onComplete, autoStart = false }: Props) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const [running, setRunning] = useState(autoStart)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    setRemaining(totalSeconds)
    setElapsed(0)
    setRunning(autoStart)
    startedRef.current = false
  }, [totalSeconds, autoStart])

  useEffect(() => {
    if (running) {
      startedRef.current = true
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            return 0
          }
          return r - 1
        })
        setElapsed(e => e + 1)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  useEffect(() => {
    if (remaining === 0 && startedRef.current) {
      onComplete?.(elapsed)
    }
  }, [remaining])

  const progress = remaining / totalSeconds
  const dashOffset = CIRC * (1 - progress)
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  const color = remaining > totalSeconds * 0.5
    ? '#22c55e'
    : remaining > totalSeconds * 0.25
    ? '#f5c518'
    : '#ef4444'

  const handleStop = () => {
    setRunning(false)
    if (startedRef.current) onComplete?.(elapsed)
  }

  const handleReset = () => {
    setRunning(false)
    setRemaining(totalSeconds)
    setElapsed(0)
    startedRef.current = false
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={SIZE} height={SIZE}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} />
          <circle
            className="timer-ring"
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
          {running && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-500 mt-0.5"
            >
              speaking
            </motion.span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {!running ? (
          <button
            onClick={() => setRunning(true)}
            disabled={remaining === 0}
            className="btn-gold text-sm py-2 px-5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {elapsed === 0 ? 'Start' : 'Resume'}
          </button>
        ) : (
          <button onClick={handleStop} className="btn-primary text-sm py-2 px-5">
            Stop
          </button>
        )}
        <button
          onClick={handleReset}
          className="text-sm py-2 px-4 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
        >
          Reset
        </button>
      </div>

      {remaining === 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-red-400 text-sm font-semibold text-center"
        >
          Time's up! You'd be cut off here.
        </motion.div>
      )}
    </div>
  )
}
