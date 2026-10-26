import './backdrop.css'

// Decorative film grain. The parallax rings were removed (designer review: distracting).
export default function Backdrop() {
  return (
    <div aria-hidden="true">
      <div className="grain" />
    </div>
  )
}
