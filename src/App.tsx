import { useEffect } from 'react'
import Header from './components/Header'
import Story from './sections/Story'
import Chapters from './sections/Chapters'
import ClinicJourney from './sections/ClinicJourney'
import Philosophy from './sections/Philosophy'
import Approach from './sections/Approach'
import Contact from './sections/Contact'
import Footer from './sections/Footer'
import { ScrollTrigger } from './lib/motion'

/**
 * One continuous narrative:
 *   I–III  Story          (WebGL object → enter the sculpture → skin reveal)
 *   IV     Chapters       (three specialty scenes)
 *   V      ClinicJourney  (four cinematic rooms)
 *   then the editorial close: philosophy, patient journey, consultation.
 */
export default function App() {
  // Recalculate trigger positions once fonts & media have settled
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => window.removeEventListener('load', refresh)
  }, [])

  return (
    <>
      <Header />
      <main id="main">
        <Story />
        <Chapters />
        <ClinicJourney />
        <Philosophy />
        <Approach />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
