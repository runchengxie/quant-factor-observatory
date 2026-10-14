import type { RiskMode } from '../shareableUrl'
import { riskHistoryCopy } from '../riskHistoryCopy'
import { useLocale } from '../i18n'
import ShareLinkButton from './ShareLinkButton'

export default function RiskModePanel({ mode, onMode, unavailable, onRetry }: {
  mode: RiskMode
  onMode: (mode: RiskMode) => void
  unavailable?: boolean
  onRetry?: () => void
}) {
  const { locale } = useLocale()
  const copy = riskHistoryCopy[locale]
  return <section className="panel risk-mode-panel">
    <div className="exploration-controls">
      <label>{copy.mode}<select aria-label={copy.mode} value={mode} onChange={(event) => onMode(event.target.value as RiskMode)}>
        <option value="demo">{copy.demo}</option><option value="historical">{copy.historical}</option>
      </select></label>
      <ShareLinkButton label={copy.share} success={copy.copied} failure={copy.copyFailed} />
    </div>
    {mode === 'demo' && <p className="panel-note">{copy.modeNote}</p>}
    {unavailable && <p className="panel-note" role="status">{copy.noAsset} {onRetry && <button type="button" className="text-button" onClick={onRetry}>{copy.retry}</button>}</p>}
  </section>
}
