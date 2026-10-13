import { posterKey } from './poster-key.ts'

// Bundled posters in assets/projects/, matched to titles by posterKey so the CMS can keep titles as plain text.
const files = import.meta.glob<string>('../../assets/projects/*.{png,jpg,jpeg,webp,avif}', { eager: true, import: 'default' })
const images = new Map(Object.entries(files).map(([path, src]) => [path.split('/').pop()!.replace(/\.\w+$/, ''), src]))

export const posterSrc = (title: string) => images.get(posterKey(title))
