import { useLocale } from '../i18n'
import { siteNavigationCopy } from '../siteNavigationCopy'
import records from '../evidenceReviewRecords.json'

export default function EvidenceReviewDate({ recordKey }: { recordKey: string }) {
  const { locale } = useLocale()
  const text = siteNavigationCopy[locale]
  const record = (records as Record<string, { reviewed_at: string | null }>)[recordKey]
  const value = record?.reviewed_at
  const date = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + 'T00:00:00Z') : null
  const valid = date && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  return <p className="panel-note evidence-review-date">{valid ? <>{text.reviewed}: <time dateTime={value!}>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)}</time></> : text.unknown}</p>
}
