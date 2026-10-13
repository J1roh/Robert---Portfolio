import './backdrop.css'

// Decorative film grain and parallax rings; motion is pure CSS (see backdrop.css).
export default function Backdrop() {
  return (
    <div aria-hidden="true">
      <div className="grain" />
      <div className="parallax-orb" />
      <div className="parallax-orb orb-two" />
    </div>
  )
}
