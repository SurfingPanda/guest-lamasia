import { formatDate } from '../lib/utils'

export default function InvitationCard({ data, className = '' }) {
  if (!data) return null

  const {
    supplier_name,
    day,
    appointment_date,
    contact_person,
    signature_data,
    approved_by,
    approver_signature,
  } = data

  return (
    <div
      className={`bg-white w-full max-w-[640px] rounded-2xl px-11 py-10 relative overflow-hidden shadow-lg border border-gray-200 flex flex-col min-h-[480px] print:shadow-none print:max-w-full print:w-full print:m-0 print:rounded-none print:border print:border-gray-200 print:px-10 print:py-8 ${className}`}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-logo-blue to-logo-cyan print:!bg-gradient-to-r" />

      {/* Header */}
      <div className="flex justify-between items-start mt-2">
        <img src="/logo.png" alt="LamAsia" className="h-[42px] w-auto" />
        <span className="text-[11px] uppercase tracking-widest text-accent font-bold border border-accent px-2.5 py-1 rounded-full">
          Visitor Invitation
        </span>
      </div>

      <h2 className="text-[28px] font-bold text-gray-800 mt-7 mb-1">You&apos;re Invited</h2>
      <p className="text-gray-500 text-sm">Please present this card on arrival at reception.</p>

      {/* Details grid — pushed down */}
      <div className="mt-auto grid grid-cols-2 gap-y-5 gap-x-6 pt-6 border-t border-gray-200">
        <CardField label="Supplier" value={supplier_name} />
        <CardField label="Appointment" value={day ? `${day}, ${formatDate(appointment_date)}` : formatDate(appointment_date)} />
        <CardField label="Contact Person" value={contact_person} />
        <div>
          <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-0.5">Signature</div>
          <div className="h-[58px] relative overflow-visible">
            {signature_data && (
              <img
                src={signature_data}
                alt=""
                className="absolute left-[-6px] bottom-[-10px] max-h-[80px] max-w-[230px] -rotate-3 origin-bottom-left pointer-events-none"
              />
            )}
          </div>
          <div className="border-t border-gray-300 text-[11px] text-gray-500 pt-0.5">
            Authorised signature
          </div>
        </div>
      </div>

      {/* Approver section */}
      {approved_by && (
        <div className="mt-5 pt-5 border-t border-dashed border-gray-300 grid grid-cols-2 gap-y-5 gap-x-6">
          <CardField label="Approved By" value={approved_by} />
          <div>
            <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-0.5">Approver Signature</div>
            <div className="h-[58px] relative overflow-visible">
              {approver_signature && (
                <img
                  src={approver_signature}
                  alt=""
                  className="absolute left-[-6px] bottom-[-10px] max-h-[80px] max-w-[230px] -rotate-3 origin-bottom-left pointer-events-none"
                />
              )}
            </div>
            <div className="border-t border-gray-300 text-[11px] text-gray-500 pt-0.5">
              Approver signature
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CardField({ label, value }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-0.5">{label}</div>
      <div className="text-[17px] font-semibold text-gray-800">{value || '—'}</div>
    </div>
  )
}
