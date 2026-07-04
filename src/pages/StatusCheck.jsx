import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import { downloadPng } from '../lib/downloadPng'
import InvitationCard from '../components/InvitationCard'

export default function StatusCheck() {
  const [searchParams] = useSearchParams()
  const [refInput, setRefInput] = useState('')
  const [result, setResult] = useState(null)
  const [cardData, setCardData] = useState(null)

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      setRefInput(ref)
      checkStatus(ref)
    }
  }, [])

  const checkStatus = async (ref) => {
    setResult(null)
    setCardData(null)

    let query
    if (ref.length >= 36) {
      query = supabase.from('requests').select('*').eq('id', ref).single()
    } else {
      query = supabase.from('requests').select('*').ilike('id', ref.toLowerCase() + '%').limit(1).single()
    }

    const { data, error } = await query
    if (error || !data) {
      setResult({ status: 'not_found' })
      return
    }

    const shortRef = data.id.split('-')[0].toUpperCase()
    setResult({ status: data.status, shortRef })
    if (data.status === 'approved') {
      setCardData(data)
    }
  }

  const handleCheck = () => {
    const raw = refInput.trim()
    if (raw) checkStatus(raw)
  }

  const statusStyles = {
    pending: 'bg-orange-50 text-orange-800',
    approved: 'bg-green-50 text-green-800',
    rejected: 'bg-red-50 text-red-800',
    not_found: 'bg-red-50 text-red-800',
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-brand text-white px-6 py-5">
        <h1 className="text-xl font-semibold m-0">LamAsia &mdash; Request Status</h1>
        <p className="text-xs opacity-80 mt-1">
          Enter your reference number to check the status of your visit request.
        </p>
      </header>

      <div className="max-w-[640px] mx-auto my-7 px-6">
        {/* Search panel */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 print:hidden">
          <label className="block text-xs font-semibold mb-1.5">Reference Number</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. A1B2C3D4 or paste the full link"
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          />
          <div className="mt-4">
            <button className="btn-primary" onClick={handleCheck}>
              Check Status
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-5 p-4 rounded-xl text-sm print:hidden ${statusStyles[result.status]}`}>
            {result.status === 'pending' && (
              <>
                <strong>Pending Review</strong><br />
                Your request (Ref: {result.shortRef}) is waiting for admin approval. Please check back later.
              </>
            )}
            {result.status === 'rejected' && (
              <>
                <strong>Not Approved</strong><br />
                Your request (Ref: {result.shortRef}) was not approved. Please contact reception for assistance.
              </>
            )}
            {result.status === 'approved' && (
              <>
                <strong>Approved!</strong><br />
                Your visit request (Ref: {result.shortRef}) has been approved. You may print your invitation card below.
              </>
            )}
            {result.status === 'not_found' && (
              <>
                <strong>Not found.</strong> Please check your reference number and try again.
              </>
            )}
          </div>
        )}

        {/* Card */}
        {cardData && (
          <>
            <div className="mt-5">
              <InvitationCard data={cardData} />
            </div>
            <div className="flex gap-2.5 mt-4 print:hidden">
              <button className="btn-secondary" onClick={() => downloadPng(cardData)}>
                Download PNG
              </button>
              <button className="btn-primary" onClick={() => window.print()}>
                Print / Save PDF
              </button>
            </div>
          </>
        )}
      </div>

      <div className="text-center text-gray-500 text-xs py-5 print:hidden">
        <Link to="/" className="text-brand-light">Submit a new request</Link>
      </div>
    </div>
  )
}
