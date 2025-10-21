#!/usr/bin/env node
import { existsSync, mkdirSync, copyFileSync } from 'fs'
import { resolve } from 'path'

const root = resolve(process.cwd())
const dist = resolve(root, 'dist')

const files = ['manifest.json', 'robots.txt', 'sitemap.xml']

mkdirSync(dist, { recursive: true })

for (const f of files) {
  const src = resolve(root, f)
  const dst = resolve(dist, f)
  if (existsSync(src)) {
    copyFileSync(src, dst)
    console.log(`Copied ${f} -> dist/`)
  } else {
    console.warn(`Skipping missing ${f}`)
  }
}
