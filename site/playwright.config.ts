import { defineConfig, devices } from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

async function availablePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No browser test port assigned')
  const port = address.port
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  return port
}

// Each invocation owns its server and artifacts, including concurrent worktrees.
process.env.PLAYWRIGHT_PORT ??= String(await availablePort())
process.env.OBSERVATORY_PLAYWRIGHT_RUN_DIRECTORY ??= mkdtempSync(join(tmpdir(), 'observatory-playwright-'))
// Workers reload this config and must inherit the runner's allocation.
const port = Number(process.env.PLAYWRIGHT_PORT)
const runDirectory = process.env.OBSERVATORY_PLAYWRIGHT_RUN_DIRECTORY
const buildDirectory = join(runDirectory, 'dist')
// Shell quoting preserves spaces and apostrophes in the temporary path.
const quotedBuildDirectory = `'${buildDirectory.replaceAll("'", "'\\''")}'`

export default defineConfig({
  testDir: './tests',
  outputDir: join(runDirectory, 'test-results'),
  fullyParallel: true,
  reporter: 'line',
  use: {
    baseURL: `http://127.0.0.1:${port}/`,
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npm run build -- --outDir ${quotedBuildDirectory} && npm run preview -- --outDir ${quotedBuildDirectory} --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: false,
  },
})
