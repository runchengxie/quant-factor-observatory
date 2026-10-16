import { useLocale } from '../i18n'
import { legacyFactorEvidence } from '../legacyFactorEvidence'
import { legacyFactorEvidenceCopy } from '../legacyFactorEvidenceCopy'

export default function LegacyFactorEvidence({ factorId }: { factorId: string }) {
  const { locale } = useLocale()
  const evidence = legacyFactorEvidence(factorId)
  if (!evidence) return null
  const copy = legacyFactorEvidenceCopy[locale] ?? legacyFactorEvidenceCopy['en-US']
  return <section className="panel" data-testid="legacy-factor-evidence">
    <p className="eyebrow">{copy.stage}</p><h2>{copy.title}</h2>
    <p>{copy.conclusion}</p><p>{copy.boundary}</p>
    <a href="https://runchengxie.github.io/quant-market-research/research/etf-rotation/">{copy.link}</a>
    <details><summary>{evidence.evidenceId}</summary><code>{evidence.sourceDigest}</code></details>
  </section>
}
