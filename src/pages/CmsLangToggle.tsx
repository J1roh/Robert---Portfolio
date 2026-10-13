import type { Language } from '../lib/content.ts'

const options: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ja', label: 'JP' },
]

// Which language's text the CMS fields edit; language-neutral fields (client, links, numbers) aren't affected.
export default function CmsLangToggle({ value, onChange }: { value: Language; onChange: (lang: Language) => void }) {
  return (
    <div className="cms-lang-toggle" role="group" aria-label="Editing language">
      {options.map(({ code, label }) => (
        <button type="button" key={code} aria-pressed={value === code} onClick={() => onChange(code)}>
          {label}
        </button>
      ))}
    </div>
  )
}
