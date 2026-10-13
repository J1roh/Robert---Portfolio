// Run: node --test src/lib/video-embed.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { embedUrl } from './video-embed.ts'

const yt = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
test('youtube watch', () => assert.equal(embedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s'), yt))
test('youtu.be', () => assert.equal(embedUrl('https://youtu.be/dQw4w9WgXcQ?si=abc'), yt))
test('youtube shorts', () => assert.equal(embedUrl('https://youtube.com/shorts/dQw4w9WgXcQ'), yt))
test('mobile youtube', () => assert.equal(embedUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ'), yt))
test('vimeo', () => assert.equal(embedUrl('https://vimeo.com/123456789'), 'https://player.vimeo.com/video/123456789'))
test('other host', () => assert.equal(embedUrl('https://example.com/watch?v=dQw4w9WgXcQ'), null))
test('not a url', () => assert.equal(embedUrl('javascript:alert(1)'), null))
test('bad id', () => assert.equal(embedUrl('https://youtu.be/"><script>'), null))
