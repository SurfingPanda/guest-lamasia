import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import SignaturePad from '../components/SignaturePad'
import InvitationCard from '../components/InvitationCard'

export default function RequestForm() {
  const [supplier, setSupplier] = useState('')
  const [contact, setContact] = useState('')
  const [day, setDay] = useState('Monday')
  const [apptDate, setApptDate] = useState('')
  const [signatureData, setSignatureData] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [copied, setCopied] = useState(false)

  const copyRef = useCallback((refId) => {
    navigator.clipboard.writeText(refId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  // Restrict date picker to selected day
  const targetDayNum = day === 'Monday' ? 1 : 2
  const getMinDate = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let diff = targetDayNum - today.getDay()
    if (diff < 0) diff += 7
    const next = new Date(today)
    next.setDate(today.getDate() + diff)
    return next.getFullYear() + '-' +
      String(next.getMonth() + 1).padStart(2, '0') + '-' +
      String(next.getDate()).padStart(2, '0')
  }

  useEffect(() => {
    if (apptDate) {
      const sel = new Date(apptDate + 'T00:00:00')
      if (sel.getDay() !== targetDayNum) setApptDate('')
    }
  }, [day])

  const previewData = {
    supplier_name: supplier.trim() || null,
    day,
    appointment_date: apptDate || null,
    contact_person: contact.trim() || null,
    signature_data: signatureData,
  }

  const handleSubmit = async () => {
    if (!supplier.trim() || !contact.trim() || !apptDate) {
      setMessage({ error: true, text: 'Please fill in all fields (Supplier, Date, Contact Person).' })
      return
    }

    setSubmitting(true)
    const { data, error } = await supabase
      .from('requests')
      .insert({
        supplier_name: supplier.trim(),
        appointment_date: apptDate,
        day,
        contact_person: contact.trim(),
        signature_data: signatureData,
      })
      .select('id')
      .single()

    setSubmitting(false)

    if (error) {
      setMessage({ error: true, text: `Error submitting request. Please try again. (${error.message})` })
      return
    }

    const refId = data.id.split('-')[0].toUpperCase()
    setMessage({
      error: false,
      refId,
      fullId: data.id,
      linkTo: `/status?ref=${data.id}`,
    })

    // Reset form
    setSupplier('')
    setContact('')
    setApptDate('')
    setDay('Monday')
    setSignatureData(null)
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
              className="input-field"
              placeholder="e.g. Acme Supplies Ltd."
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5">Appointment Date</label>
            <div className="flex gap-2.5">
              {['Monday', 'Tuesday'].map((d) => (
                <label
                  key={d}
                  className={`flex-1 text-center py-2.5 border rounded-lg cursor-pointer font-semibold text-sm select-none transition-colors ${
                    day === d
                      ? 'bg-brand text-white border-brand'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="day"
                    value={d}
                    checked={day === d}
                    onChange={() => setDay(d)}
                    className="hidden"
                  />
                  {d}
                </label>
              ))}
            </div>
            <input
              type="date"
              className="input-field mt-2.5"
              value={apptDate}
              onChange={(e) => setApptDate(e.target.value)}
              min={getMinDate()}
              step="7"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5">Contact Person</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Jane Doe"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <SignaturePad onSignatureChange={setSignatureData} />
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
