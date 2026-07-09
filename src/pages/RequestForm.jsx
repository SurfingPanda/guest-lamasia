import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SignaturePad from '../components/SignaturePad'
import InvitationCard from '../components/InvitationCard'

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function toISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function dayNameFor(iso) {
  return new Date(iso + 'T00:00:00').getDay() === 1 ? 'Monday' : 'Tuesday'
}

// Only Mondays and Tuesdays are valid appointment days
function getUpcomingDates(count) {
  const dates = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  for (let i = 0; dates.length < count && i < 60; i++) {
    if (d.getDay() === 1 || d.getDay() === 2) dates.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

export default function RequestForm() {
  const [supplier, setSupplier] = useState('')
  const [contact, setContact] = useState('')
  const [apptDate, setApptDate] = useState('')
  const [signatureData, setSignatureData] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [copied, setCopied] = useState(false)

  const upcomingDates = useMemo(() => getUpcomingDates(8), [])

  const copyRef = useCallback((refId) => {
    navigator.clipboard.writeText(refId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const previewData = {
    supplier_name: supplier.trim() || null,
    day: apptDate ? dayNameFor(apptDate) : null,
    appointment_date: apptDate || null,
    contact_person: contact.trim() || null,
    signature_data: signatureData,
  }

  const handleSubmit = async () => {
    const errors = {}
    if (!supplier.trim()) errors.supplier = 'Supplier name is required.'
    if (!apptDate) errors.apptDate = 'Please select an appointment date.'
    if (!contact.trim()) errors.contact = 'Contact person is required.'
    if (!signatureData) errors.signature = 'Please provide a signature.'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setMessage(null)
      return
    }

    setMessage(null)
    setSubmitting(true)
    const { data: newId, error } = await supabase.rpc('submit_request', {
      p_supplier_name: supplier.trim(),
      p_appointment_date: apptDate,
      p_day: dayNameFor(apptDate),
      p_contact_person: contact.trim(),
      p_signature_data: signatureData,
    })

    setSubmitting(false)

    if (error) {
      setMessage({ error: true, text: `Error submitting request. Please try again. (${error.message})` })
      return
    }

    const refId = newId.split('-')[0].toUpperCase()
    setMessage({
      error: false,
      refId,
      fullId: newId,
      linkTo: `/status?ref=${newId}`,
    })

    // Reset form
    setSupplier('')
    setContact('')
    setApptDate('')
    setSignatureData(null)
    setFieldErrors({})
  }

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-brand text-white px-6 py-5 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold m-0">LamAsia &mdash; Visitor Request</h1>
          <p className="text-xs opacity-80 mt-1">
            Fill in the details below and submit your visit request. You'll receive a reference number to check your status.
          </p>
        </div>
        <Link
          to="/admin"
          className="bg-white/15 border border-white/30 text-white px-4 py-1.5 rounded-lg text-xs no-underline font-medium whitespace-nowrap hover:bg-white/25 transition-colors"
        >
          Admin Login
        </Link>
      </header>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-7 max-w-[1180px] mx-auto my-7 px-6 items-start">
        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-semibold">Invitation Details</h2>

          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5">Supplier Name</label>
            <input
              type="text"
              className={`input-field ${fieldErrors.supplier ? 'border-red-400' : ''}`}
              placeholder="e.g. Acme Supplies Ltd."
              value={supplier}
              onChange={(e) => { setSupplier(e.target.value); clearFieldError('supplier') }}
            />
            {fieldErrors.supplier && <p className="mt-1 text-xs text-red-600">{fieldErrors.supplier}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5">Appointment Date</label>
            <p className="text-xs text-gray-500 mb-2">Visits are only available on Mondays and Tuesdays.</p>
            <div className="grid grid-cols-2 gap-2">
              {upcomingDates.map((d) => {
                const iso = toISO(d)
                const selected = apptDate === iso
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => { setApptDate(iso); clearFieldError('apptDate') }}
                    className={`py-2.5 border rounded-lg font-semibold text-sm transition-colors ${
                      selected
                        ? 'bg-brand text-white border-brand'
                        : fieldErrors.apptDate
                          ? 'border-red-400 hover:bg-gray-50'
                          : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {WEEKDAY_SHORT[d.getDay()]}, {d.getDate()} {MONTH_SHORT[d.getMonth()]}
                  </button>
                )
              })}
            </div>
            {fieldErrors.apptDate && <p className="mt-1 text-xs text-red-600">{fieldErrors.apptDate}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5">Contact Person</label>
            <input
              type="text"
              className={`input-field ${fieldErrors.contact ? 'border-red-400' : ''}`}
              placeholder="e.g. Jane Doe"
              value={contact}
              onChange={(e) => { setContact(e.target.value); clearFieldError('contact') }}
            />
            {fieldErrors.contact && <p className="mt-1 text-xs text-red-600">{fieldErrors.contact}</p>}
          </div>

          <div className="mb-4">
            <SignaturePad
              error={fieldErrors.signature}
              onSignatureChange={(data) => { setSignatureData(data); if (data) clearFieldError('signature') }}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>

          {message && (
            <div
              className={`mt-3.5 p-3.5 rounded-lg text-sm ${
                message.error
                  ? 'bg-red-50 text-red-800'
                  : 'bg-green-50 text-green-800'
              }`}
            >
              {message.error ? (
                <span>{message.text}</span>
              ) : (
                <>
                  <span>Request submitted! Your reference number is:</span>
                  <span className="inline-flex items-center gap-1.5 ml-1">
                    <strong className="font-mono tracking-wide">{message.refId}</strong>
                    <button
                      type="button"
                      onClick={() => copyRef(message.fullId)}
                      className="inline-flex items-center gap-1 bg-white/80 border border-green-300 text-green-700 px-2 py-0.5 rounded text-xs font-medium cursor-pointer hover:bg-white transition-colors"
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </span>
                  <br />
                  <Link to={message.linkTo} className="text-brand-light font-medium">
                    Check your request status here
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6 print:hidden">
          <p className="text-xs text-gray-500 mb-3">Live preview</p>
          <InvitationCard data={previewData} />
        </div>
      </div>

      <div className="text-center text-gray-500 text-xs py-5 print:hidden">
        LamAsia Visitor Request &mdash;{' '}
        <Link to="/status" className="text-brand-light">
          Check request status
        </Link>
      </div>
    </div>
  )
}
