import Backdrop from '../features/backdrop/Backdrop.tsx'
import Hero from '../features/hero/Hero.tsx'
import Projects from '../features/projects/Projects.tsx'
import About from '../features/about/About.tsx'
import Contact from '../features/contact/Contact.tsx'
import type { Content, Copy, Language } from '../lib/content.ts'

type Props = { copy: Copy; language: Language; content: Content }

export default function Landing({ copy, language, content }: Props) {
  return (
    <>
      <Backdrop />
      <Hero copy={copy} language={language} />
      <Projects copy={copy} language={language} projects={content.projects} />
      <About copy={copy} />
      <Contact copy={copy} links={content.links} />
    </>
  )
}
