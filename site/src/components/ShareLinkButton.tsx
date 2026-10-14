import { useState } from 'react'
import { copyCurrentUrl } from '../shareableUrl'

export default function ShareLinkButton({ label, success, failure }: { label: string; success: string; failure: string }) {
  const [status, setStatus] = useState('')
  return <span className="share-link-control">
    <button type="button" className="quiet-button" onClick={async () => setStatus(await copyCurrentUrl() ? success : failure)}>{label}</button>
    {status && <span role="status">{status}</span>}
  </span>
}
