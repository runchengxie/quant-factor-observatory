import { useEffect, useRef, type ReactNode } from 'react'
import { useLocale } from '../i18n'
import { siteNavigationCopy } from '../siteNavigationCopy'

export default function SiteNavigation({ path, children }: { path: string; children: ReactNode }) {
  const { locale, copy } = useLocale()
  const text = siteNavigationCopy[locale]
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const close = (event: PointerEvent | KeyboardEvent) => {
      const nav = ref.current
      if (!nav) return
      if (event instanceof KeyboardEvent ? event.key !== 'Escape' : nav.contains(event.target as Node)) return
      const open = nav.querySelector<HTMLDetailsElement>('details[open]')
      if (event instanceof KeyboardEvent && open?.contains(document.activeElement)) open.querySelector('summary')?.focus()
      nav.querySelectorAll<HTMLDetailsElement>('details').forEach(d => { d.open = false })
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close) }
  }, [])
  const active = (route: string) => path === route || path.startsWith(route + '/')
  const link = (route: string, label: string) => <a key={route} className={active(route) ? 'active' : undefined} aria-current={path === route ? 'page' : undefined} href={import.meta.env.BASE_URL + route}>{label}</a>
  const group = (name: string, routes: string[]) => <details className="site-nav-group" onToggle={event => {
    const current = event.currentTarget
    if (current.open) ref.current?.querySelectorAll<HTMLDetailsElement>('details').forEach(d => { if (d !== current) d.open = false })
  }}>
    <summary className={routes.some(active) ? 'active' : undefined}>{name}</summary>
    <div className="site-nav-submenu">{routes.map(route => link(route, copy.nav[route]))}</div>
  </details>
  return <nav className="site-nav" aria-label={text.label} ref={ref}>
    {link('', copy.nav.overview)}
    {group(text.research, ['studies', 'fundamentals', 'jumps', 'hermite'])}
    {group(text.factors, ['factors', 'alpha810'])}
    {link('quality', copy.nav.quality)}
    {children}
  </nav>
}
