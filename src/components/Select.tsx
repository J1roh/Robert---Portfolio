import { useState } from 'react'
import { Select as BaseSelect } from '@base-ui/react/select'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import './select.css'

type Props = {
  name: string
  options: string[]
  placeholder: string
  required?: boolean
  'aria-labelledby'?: string
}

// Site default select: Base UI Select animated with Motion, after https://motion.dev/examples/react-base-select.
// `name` posts the chosen option with the surrounding form, like a native <select>.
export default function Select({ name, options, placeholder, required, ...aria }: Props) {
  const [open, setOpen] = useState(false)

  return (
    // "user": skips the scale animations when the visitor prefers reduced motion.
    <MotionConfig reducedMotion="user">
      {/* modal={false}: the default locks page scroll, which hides the scrollbar and makes the whole page jump sideways. */}
      <BaseSelect.Root name={name} required={required} open={open} onOpenChange={setOpen} modal={false}>
        <BaseSelect.Trigger
          className="select-trigger"
          {...aria}
          render={<motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} />}
        >
          <BaseSelect.Value>{(value: string | null) => value ?? <span className="select-placeholder">{placeholder}</span>}</BaseSelect.Value>
          <BaseSelect.Icon className="select-icon">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </BaseSelect.Icon>
        </BaseSelect.Trigger>

        <AnimatePresence>
          {open && (
            <BaseSelect.Portal>
              <BaseSelect.Positioner className="select-positioner" sideOffset={6} alignItemWithTrigger={false}>
                <BaseSelect.Popup
                  className="select-popup"
                  render={
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    />
                  }
                >
                  {options.map((option) => (
                    <BaseSelect.Item key={option} value={option} className="select-item">
                      <BaseSelect.ItemText>{option}</BaseSelect.ItemText>
                    </BaseSelect.Item>
                  ))}
                </BaseSelect.Popup>
              </BaseSelect.Positioner>
            </BaseSelect.Portal>
          )}
        </AnimatePresence>
      </BaseSelect.Root>
    </MotionConfig>
  )
}
