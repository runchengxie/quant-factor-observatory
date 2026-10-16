import evidence from '../public/data/legacy-strategy-evidence.json'
import review from '../public/data/legacy-strategy-review.json'

export const legacyFactorIds = ['illiquidity', 'realized_variance'] as const

export function legacyFactorEvidence(factorId: string) {
  if (!legacyFactorIds.some(id => id === factorId)) return undefined
  if (evidence.schema_version !== 'research.legacy_strategy_public.v1' ||
      evidence.reviewed_source_digest !== review.source_sha256 ||
      evidence.reviewed_content_digest !== review.content_sha256) {
    throw new Error('Legacy evidence review identity mismatch')
  }
  const study = evidence.studies.find(study => study.id === 'etf-rotation')
  if (!study || !study.factor_refs.includes(factorId)) return undefined
  return { factorId, studyId: study.id, evidenceId: study.evidence_id,
    stage: 'methods-only', sourceDigest: evidence.reviewed_source_digest }
}
