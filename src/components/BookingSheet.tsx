import { useEffect, useState } from 'react'
import { X, Car, Users, MapPin, Calendar, Sparkles } from 'lucide-react'
import { Button } from './ui/Button'
import { bookRide } from '../lib/api'
import { formatDayAndTime } from '../lib/usePatientContext'
import type { PatientVisitContext, Ride, RideLeg, TimeOffset } from '../lib/types'

interface BookingSheetProps {
  open: boolean
  leg: RideLeg
  context: PatientVisitContext
  timeOffset: TimeOffset
  onClose: () => void
  onBooked: (ride: Ride) => void
}

const VEHICLE_LABELS: Record<Ride['vehicle_preference'], string> = {
  uberx: 'UberX',
  uber_comfort: 'Uber Comfort',
  uber_xl: 'Uber XL',
  wav: 'Wheelchair Accessible',
}

export function BookingSheet({
  open,
  leg,
  context,
  timeOffset,
  onClose,
  onBooked,
}: BookingSheetProps) {
  const tx = context.transportation
  const isOutbound = leg === 'outbound'
  const defaultPickup = isOutbound
    ? tx.suggested_outbound_pickup_iso
    : tx.suggested_return_pickup_iso

  const [vehicle, setVehicle] = useState<Ride['vehicle_preference']>(tx.default_vehicle_preference)
  const [withCaregiver, setWithCaregiver] = useState<boolean>(tx.caregiver_default)
  const [wheelchair, setWheelchair] = useState<boolean>(tx.wheelchair_accessible_required)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setVehicle(tx.default_vehicle_preference)
      setWithCaregiver(tx.caregiver_default)
      setWheelchair(tx.wheelchair_accessible_required)
      setError(null)
    }
  }, [open, leg, tx.default_vehicle_preference, tx.caregiver_default, tx.wheelchair_accessible_required])

  if (!open) return null

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const ride = await bookRide({
        patientId: context.patient.id,
        visitId: context.visit.id,
        timeOffset,
        leg,
        scheduled_pickup_iso: defaultPickup,
        vehicle_preference: vehicle,
        with_caregiver: withCaregiver,
        wheelchair_accessible: wheelchair,
      })
      onBooked(ride)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  const pickupAddress = isOutbound ? tx.home_address : tx.site_address
  const dropoffAddress = isOutbound ? tx.site_address : tx.home_address
  const caregiverAvailable = Boolean(context.patient.caregiver)

  return (
    <div className="absolute inset-0 z-30 flex items-end sm:items-center justify-center bg-stone-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-stone-200 max-h-[90%] overflow-y-auto sm:max-w-[400px] sm:max-h-[700px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-700">
              {tx.provider}
            </p>
            <h2 className="text-lg font-semibold text-stone-900 mt-0.5">
              {isOutbound ? 'Book your ride to the clinic' : 'Book your ride home'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {tx.sponsor_paid && (
          <div className="mx-5 mb-4 rounded-xl bg-gradient-to-br from-primary-50 to-stone-50 border border-primary-100 p-3 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-primary-600 mt-0.5 shrink-0" />
            <p className="text-xs text-stone-700 leading-relaxed">
              <span className="font-semibold text-stone-900">Covered by your study.</span>{' '}
              No payment, no Uber account needed — your sponsor handles it.
            </p>
          </div>
        )}

        <div className="px-5 space-y-4 pb-3">
          <Field label="Pickup time" icon={<Calendar className="h-3.5 w-3.5" />}>
            <p className="text-sm font-medium text-stone-900">{formatDayAndTime(defaultPickup)}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Suggested {isOutbound ? '45 min before your visit' : '15 min after your visit ends'}
            </p>
          </Field>

          <Field label="Pickup" icon={<MapPin className="h-3.5 w-3.5" />}>
            <p className="text-sm text-stone-900">{pickupAddress}</p>
          </Field>

          <Field label="Drop-off" icon={<MapPin className="h-3.5 w-3.5" />}>
            <p className="text-sm text-stone-900">{dropoffAddress}</p>
          </Field>

          <Field label="Vehicle" icon={<Car className="h-3.5 w-3.5" />}>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {(['uberx', 'uber_comfort', 'uber_xl', 'wav'] as const).map((v) => {
                const active = v === vehicle
                return (
                  <button
                    key={v}
                    onClick={() => setVehicle(v)}
                    className={`text-left rounded-xl border px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'border-primary-500 bg-primary-50/50 text-stone-900'
                        : 'border-stone-200 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    {VEHICLE_LABELS[v]}
                  </button>
                )
              })}
            </div>
          </Field>

          {caregiverAvailable && tx.sponsor_paid && (
            <Toggle
              icon={<Users className="h-3.5 w-3.5" />}
              label={`Add ${context.patient.caregiver?.name ?? 'caregiver'} as additional rider`}
              hint={`Your ${context.patient.caregiver?.relationship ?? 'caregiver'} can ride with you. Same Uber, no extra cost.`}
              checked={withCaregiver}
              onChange={setWithCaregiver}
            />
          )}

          <Toggle
            icon={<Car className="h-3.5 w-3.5" />}
            label="I need wheelchair accessibility"
            hint="A WAV (wheelchair-accessible vehicle) will be dispatched."
            checked={wheelchair}
            onChange={setWheelchair}
          />
        </div>

        {error && (
          <div className="mx-5 mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="px-5 pb-5 pt-2 sticky bottom-0 bg-white border-t border-stone-100">
          <Button onClick={submit} size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Booking…' : tx.sponsor_paid ? 'Book — covered by your study' : 'Book ride'}
          </Button>
          {tx.sponsor_paid && (
            <p className="text-[11px] text-stone-500 mt-2 text-center">
              You'll get a confirmation, driver name, and live ETA on the morning of your visit.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1 text-[11px] font-medium uppercase tracking-wide text-stone-500">
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  )
}

function Toggle({
  icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full text-left rounded-xl border px-3.5 py-3 transition-colors ${
        checked ? 'border-primary-500 bg-primary-50/40' : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-stone-500 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-900">{label}</p>
          {hint && <p className="text-[11px] text-stone-500 mt-0.5">{hint}</p>}
        </div>
        <span
          className={`h-5 w-9 rounded-full p-0.5 transition-colors shrink-0 mt-0.5 ${
            checked ? 'bg-primary-600' : 'bg-stone-300'
          }`}
        >
          <span
            className={`block h-4 w-4 rounded-full bg-white transition-transform ${
              checked ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </span>
      </div>
    </button>
  )
}

