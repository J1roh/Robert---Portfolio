import ScrambleText from '../../components/ScrambleText.tsx'
import RollingNumber from '../../components/RollingNumber.tsx'
import type { Copy } from '../../lib/content.ts'
import './about.css'

export default function About({ copy }: { copy: Copy }) {
  return (
    <section className="section" id="about" aria-labelledby="about-heading">
      <div className="section-heading">
        <h2 id="about-heading" className="kicker">02 / {copy.services}</h2>
        <p>{copy.servicesNote}</p>
      </div>
      <div className="about-grid">
        <p className="about-statement">
          <ScrambleText text={copy.approach}>
            {/* split() with a capture group puts each number and its unit (13,000件以上) at odd indexes; they stay on one line. */}
            {copy.approach.split(/(\d[\d,]*\S*)/).map((part, i) => {
              if (!(i % 2)) return part
              const unit = part.replace(/^[\d,]+/, '')
              return <span key={i} className="about-number">
                <RollingNumber value={part.slice(0, part.length - unit.length)} />{unit}
              </span>
            })}
          </ScrambleText>
        </p>
        <div className="about-copy">
          <p>{copy.about}</p>
          <ul>
            {copy.serviceList.map((service, i) => (
              <li key={service}>
                <span aria-hidden="true">0{i + 1}</span>
                {service}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
