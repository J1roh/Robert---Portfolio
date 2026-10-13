import { useState } from 'react'

// Remembers a visitor's choice. The saved value is checked against `allowed` because localStorage can hold anything.
export function useStoredChoice<T extends string>(key: string, allowed: readonly T[], fallback: () => T | null) {
  const [value, setValue] = useState<T | null>(() => {
    const saved = localStorage.getItem(key)
    return allowed.find((option) => option === saved) ?? fallback()
  })

  function choose(next: T) {
    localStorage.setItem(key, next)
    setValue(next)
  }

  return [value, choose] as const
}
