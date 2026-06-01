import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import SpeechPractice from './pages/SpeechPractice'
import ModCaucus from './pages/ModCaucus'
import UnmodCaucus from './pages/UnmodCaucus'
import ProcedureGuide from './pages/ProcedureGuide'

export type Page = 'home' | 'speech' | 'mod' | 'unmod' | 'procedure'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.18 } },
}

export default function App() {
  const [page, setPage] = useState<Page>('home')

  return (
    <div style={{ minHeight: '100vh', background: '#09090b' }}>
      <Navigation current={page} onNavigate={setPage} />
      <AnimatePresence mode="wait">
        <motion.div key={page} variants={pageVariants} initial="initial" animate="animate" exit="exit">
          {page === 'home'      && <Home onNavigate={setPage} />}
          {page === 'speech'    && <SpeechPractice />}
          {page === 'mod'       && <ModCaucus />}
          {page === 'unmod'     && <UnmodCaucus />}
          {page === 'procedure' && <ProcedureGuide />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
