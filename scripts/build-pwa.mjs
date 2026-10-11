import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = '.output/public'
const metadata = JSON.parse(await readFile(join(root, '_nuxt/builds/latest.json'), 'utf8'))
if (typeof metadata?.id !== 'string' || !/^[a-f\d-]{36}$/.test(metadata.id)) throw new Error('Brak identyfikatora builda Nuxt.')
async function files(directory) {
  const entries = await readdir(join(root, directory), { withFileTypes: true })
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(`${directory}/${entry.name}`) : [`/${directory}/${entry.name}`]))).flat()
}
const assets = ['/index.html', '/favicon.svg', '/manifest.webmanifest', ...await files('icons'), ...await files('_nuxt')]
if (assets.some(path => !/^\/(?:index\.html|favicon\.svg|manifest\.webmanifest|(?:icons|_nuxt)\/[\w./-]+)$/.test(path) || path.includes('..'))) throw new Error('Niedozwolony zasób PWA.')
const source = await readFile('app/service-worker.js', 'utf8')
const worker = source.replace(/'__SILKA_BUILD_ID__'/, JSON.stringify(metadata.id)).replace('/* SILKA_ASSETS */ []', JSON.stringify(assets.sort()))
if (worker === source || worker.includes('__SILKA_BUILD_ID__') || worker.includes('/* SILKA_ASSETS */')) throw new Error('Nie udało się zbudować service workera.')
await writeFile(join(root, 'sw.js'), worker)
console.log(`PWA: ${assets.length} statycznych zasobów, build ${metadata.id}.`)
