import { createHash } from 'node:crypto'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readdir, readFile, writeFile } from 'node:fs/promises'

const dist = new URL('../dist/', import.meta.url)
const files = (await readdir(dist, { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile() && entry.name !== 'sw.js')
  .map(entry => relative(fileURLToPath(dist), entry.path).split(/[/\\]/).filter(Boolean)
    .concat(entry.name).join('/'))
  .sort()
const hash = createHash('sha256')
const worker = await readFile(new URL('sw-template.js', import.meta.url), 'utf8')
hash.update(worker)
for (const file of files) {
  hash.update(file)
  hash.update(await readFile(new URL(file, dist)))
}
await writeFile(new URL('sw.js', dist), worker
  .replace('__VERSION__', hash.digest('hex').slice(0, 16))
  .replace('__FILES__', JSON.stringify(['./', ...files.map(file => './' + file)])))
