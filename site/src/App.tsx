import { lazy, Suspense, useEffect, useState } from 'react'
import { loadAlpha810Snapshot, loadFundamentalData, loadRdAnnualEvidence, loadRiskHistory, loadSnapshot, loadStudies } from './data'
import { formatDataLoadError } from './dataErrors'
import { buildResearchContext, toResearchRecords } from './research'
import type { Alpha810Snapshot, FundamentalCatalog, FundamentalSnapshot, RdAnnualEvidence, Snapshot, StudyCatalog } from './types'
import type { RiskHistory } from './riskHistory'
import { initialLocale, LocaleContext, useLocale, type Copy, type Locale } from './i18n'

const OverviewPage = lazy(() => import('./pages/OverviewPage'))
const FactorPage = lazy(() => import('./pages/FactorPage'))
const JumpPage = lazy(() => import('./pages/JumpPage'))
const HermitePage = lazy(() => import('./pages/HermitePage'))
const FundamentalsPage = lazy(() => import('./pages/FundamentalsPage'))
const FactorExplorerPage = lazy(() => import('./pages/FactorExplorerPage'))
const StudiesPage = lazy(() => import('./pages/StudiesPage').then((module) => ({ default: module.StudiesPage })))
const ResearchEvidencePage = lazy(() => import('./pages/ResearchEvidencePage'))
const StudyComparisonPage = lazy(() => import('./pages/StudyComparisonPage'))
const StudyDetailPage = lazy(() => import('./pages/StudiesPage').then((module) => ({ default: module.StudyDetailPage })))
const Alpha810OverviewPage = lazy(() => import('./pages/Alpha810OverviewPage'))
const Alpha810FactorPage = lazy(() => import('./pages/Alpha810FactorPage'))
const QualityPage = lazy(() => import('./pages/QualityPage'))

type Theme = 'light' | 'dark'
type FundamentalData = { catalog: FundamentalCatalog; snapshot: FundamentalSnapshot }
type RouteData =
  | { kind: 'overview'; snapshot: Snapshot; fundamental: FundamentalData; studies: StudyCatalog }
  | { kind: 'market'; snapshot: Snapshot; riskHistory: RiskHistory | null }
  | { kind: 'quality'; riskHistory: RiskHistory | null }
  | { kind: 'fundamentals'; fundamental: FundamentalData }
  | { kind: 'studies'; studies: StudyCatalog; rdAnnual?: RdAnnualEvidence }
  | { kind: 'research'; snapshot: Snapshot; fundamental: FundamentalData }
  | { kind: 'alpha810'; snapshot: Alpha810Snapshot }
  | { kind: 'not-found' }

function currentPath() {
  return window.location.pathname.replace(import.meta.env.BASE_URL, '').replace(/^\//, '').replace(/\/$/, '')
}

async function loadRouteData(path: string): Promise<RouteData> {
  if (path === '' || path === 'index.html') {
    const [snapshot, fundamental, studies] = await Promise.all([loadSnapshot(), loadFundamentalData(), loadStudies()])
    return { kind: 'overview', snapshot, fundamental, studies }
  }
  if (path === 'jumps' || path === 'hermite') {
    const [snapshot, riskHistory] = await Promise.all([loadSnapshot(), loadRiskHistory()])
    return { kind: 'market', snapshot, riskHistory }
  }
  if (path === 'quality') return { kind: 'quality', riskHistory: await loadRiskHistory() }
  if (path === 'fundamentals') return { kind: 'fundamentals', fundamental: await loadFundamentalData() }
  if (path === 'studies' || path.startsWith('studies/')) {
    const [studies, rdAnnual] = await Promise.all([
      loadStudies(),
      path === 'studies/rd-investment' ? loadRdAnnualEvidence().catch(() => undefined) : Promise.resolve(undefined),
    ])
    return { kind: 'studies', studies, rdAnnual }
  }
  if (path === 'factors' || path.startsWith('factors/')) {
    const [snapshot, fundamental] = await Promise.all([loadSnapshot(), loadFundamentalData()])
    return { kind: 'research', snapshot, fundamental }
  }
  if (path === 'alpha810' || path.startsWith('alpha810/factors/')) return { kind: 'alpha810', snapshot: await loadAlpha810Snapshot() }
  return { kind: 'not-found' }
}

function pathView(path: string, data: RouteData, copy: Copy) {
  if (data.kind === 'not-found') return <main className="empty"><h1>{copy.notFound}</h1><a href={import.meta.env.BASE_URL}>{copy.backHome}</a></main>
  if (data.kind === 'overview') {
    const records = toResearchRecords(data.snapshot, data.fundamental.catalog, data.fundamental.snapshot)
    return <OverviewPage snapshot={data.snapshot} records={records} context={buildResearchContext(data.snapshot)} fundamental={data.fundamental.snapshot} studies={data.studies} />
  }
  if (data.kind === 'market') return path === 'jumps' ? <JumpPage snapshot={data.snapshot} riskHistory={data.riskHistory} /> : <HermitePage snapshot={data.snapshot} riskHistory={data.riskHistory} />
  if (data.kind === 'quality') return <QualityPage riskHistory={data.riskHistory} />
  if (data.kind === 'fundamentals') return <FundamentalsPage catalog={data.fundamental.catalog} snapshot={data.fundamental.snapshot} />
  if (data.kind === 'studies') {
    if (path === 'studies') return <StudiesPage catalog={data.studies} />
    if (path === 'studies/evidence') return <ResearchEvidencePage catalog={data.studies} />
    if (path === 'studies/compare') return <StudyComparisonPage catalog={data.studies} />
    return <StudyDetailPage catalog={data.studies} study={data.studies.studies.find((item) => item.id === path.slice(8))} updatedAt={data.studies.updated_at} rdAnnual={data.rdAnnual} />
  }
  if (data.kind === 'research') {
    const records = toResearchRecords(data.snapshot, data.fundamental.catalog, data.fundamental.snapshot)
    const context = buildResearchContext(data.snapshot)
    if (path === 'factors') return <FactorExplorerPage records={records} context={context} />
    const factor = records.find((item) => item.id === decodeURIComponent(path.slice(8)))
    return <FactorPage factor={factor} context={context} fundamental={data.fundamental.snapshot} />
  }
  if (path === 'alpha810') return <Alpha810OverviewPage snapshot={data.snapshot} />
  return <Alpha810FactorPage factor={data.snapshot.factors.find((item) => item.name === decodeURIComponent(path.slice(17)))} snapshot={data.snapshot} />
}

function initialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem('quant-factor-theme')
    if (stored === 'dark' || stored === 'light') return stored
  } catch { /* storage is optional */ }
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    try { window.localStorage.setItem('quant-factor-theme', theme) } catch { /* storage is optional */ }
  }, [theme])
  return <LocaleContext.Provider value={{ locale, setLocale }}><AppContent theme={theme} setTheme={setTheme} /></LocaleContext.Provider>
}

function AppContent({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  const path = currentPath()
  const [data, setData] = useState<RouteData | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const { copy, locale, setLocale } = useLocale()
  useEffect(() => {
    let active = true
    setData(null)
    setError(null)
    loadRouteData(path).then((result) => { if (active) setData(result) }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason : new Error(copy.loadError))
    })
    return () => { active = false }
  }, [path])

  const pathname = window.location.pathname
  const active = (segment: string) => pathname.includes(segment) ? 'active' : undefined
  const switchLocale = () => {
    const next = locale === 'en-US' ? 'zh-CN' : 'en-US'
    try { window.localStorage.setItem('quant-factor-locale', next) } catch { /* storage is optional */ }
    setLocale(next)
  }
  const switchTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  const sourceLabel = data?.kind === 'studies' || path.startsWith('studies/') ? copy.nav.studies : data?.kind === 'quality' ? copy.nav.quality : data && data.kind !== 'alpha810' && data.kind !== 'fundamentals' && data.kind !== 'not-found' && data.snapshot.source === 'demo' ? copy.sourceDemo : copy.sourcePublic
  return <><header className="site-header"><div className="site-masthead"><a className="brand" href={import.meta.env.BASE_URL}><span className="brand-kicker">QUANT FACTOR</span><strong>OBSERVATORY</strong></a><div className="site-meta"><strong>{copy.brandMeta}</strong><span>{copy.brandMetaSub}</span></div></div><nav className="site-nav"><a className={pathname.endsWith('/') || pathname.endsWith('index.html') ? 'active' : undefined} href={import.meta.env.BASE_URL}>{copy.nav.overview}</a><a className={active('alpha810')} href={`${import.meta.env.BASE_URL}alpha810`}>{copy.nav.alpha810}</a><a className={active('factors')} href={`${import.meta.env.BASE_URL}factors`}>{copy.nav.factors}</a><a className={active('studies')} href={`${import.meta.env.BASE_URL}studies`}>{copy.nav.studies}</a><a className={active('fundamentals')} href={`${import.meta.env.BASE_URL}fundamentals`}>{copy.nav.fundamentals}</a><a className={active('jumps')} href={`${import.meta.env.BASE_URL}jumps`}>{copy.nav.jumps}</a><a className={active('hermite')} href={`${import.meta.env.BASE_URL}hermite`}>{copy.nav.hermite}</a><a className={active('quality')} href={`${import.meta.env.BASE_URL}quality`}>{copy.nav.quality}</a><button type="button" className="locale-toggle" onClick={switchLocale} aria-label={copy.switchLanguage.replace('{language}', copy.switchTo)}>{copy.switchTo}</button><button type="button" className="theme-toggle" onClick={switchTheme} aria-pressed={theme === 'dark'}>{theme === 'dark' ? '☼' : '☾'} <span>{theme === 'dark' ? copy.themeLight : copy.themeToggle}</span></button></nav></header>
    {error ? <main className="empty"><h1>{copy.loadError}</h1><p>{formatDataLoadError(error, locale)}</p><button onClick={() => window.location.reload()}>{copy.retry}</button></main> : !data ? <main className="empty"><p>{copy.loading}</p></main> : <Suspense fallback={<main className="empty"><p>{copy.loading}</p></main>}>{pathView(path, data, copy)}</Suspense>}
    <footer className="site-footer"><span>quant-factor-observatory · {sourceLabel}</span><span>{copy.footerNote}</span></footer></>
}
