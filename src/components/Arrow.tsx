import './arrow.css'

export default function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg aria-hidden="true" className={down ? 'arrow arrow-down' : 'arrow'} viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  )
}
