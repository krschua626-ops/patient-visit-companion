import { useEffect, useRef, useState } from 'react'
import {
  Car,
  Sparkles,
  CheckCircle2,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Star,
  Phone,
  X,
} from 'lucide-react'
import { Card, CardBody } from './ui/Card'
import { Badge } from './ui/Badge'
import { BookingSheet } from './BookingSheet'
import { cancelRide } from '../lib/api'
import { formatDayAndTime } from '../lib/usePatientContext'
import type { PatientVisitContext, Ride, RideLeg, RideStatus, TimeOffset } from '../lib/types'
import { cn } from '../lib/cn'

interface Props {
  context: PatientVisitContext
  timeOffset: TimeOffset
  onChanged: () => void
}

function activeLegForTimeOffset(timeOffset: TimeOffset): RideLeg {
  return timeOffset === 'post_visit' || timeOffset === 'days_plus_3' ? 'return' : 'outbound'
}

const STATUS_LABELS_OUTBOUND: Record<RideStatus, string> = {
  not_booked: 'Not booked',
  booking: 'Booking…',
  confirmed: 'Confirmed',
  driver_assigned: 'Driver assigned',
  en_route_to_pickup: 'Driver on the way',
  arrived_at_pickup: 'Driver has arrived',
  in_transit: 'On the way to your visit',
  completed: 'Trip complete',
  cancelled: 'Cancelled',
}

const STATUS_LABELS_RETURN: Record<RideStatus, string> = {
  not_booked: 'Not booked',
  booking: 'Booking…',
  confirmed: 'Confirmed',
  driver_assigned: 'Driver assigned',
  en_route_to_pickup: 'Driver heading to clinic',
  arrived_at_pickup: 'Driver waiting at clinic',
  in_transit: 'On the way home',
  completed: 'Home safe',
  cancelled: 'Cancelled',
}

function statusLabel(ride: Ride): string {
  return ride.leg === 'return' ? STATUS_LABELS_RETURN[ride.status] : STATUS_LABELS_OUTBOUND[ride.status]
}

const POLLING_STATUSES: RideStatus[] = [
  'driver_assigned',
  'en_route_to_pickup',
  'arrived_at_pickup',
  'in_transit',
]

export function TransportationCard({ context, timeOffset, onChanged }: Props) {
  const activeLeg = activeLegForTimeOffset(timeOffset)
  const ride =
    activeLeg === 'outbound'
      ? context.transportation.outbound_ride
      : context.transportation.return_ride
  const outboundForReturnContext =
    activeLeg === 'return' ? context.transportation.outbound_ride : null
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetLeg, setSheetLeg] = useState<RideLeg>(activeLeg)
  const [cancelling, setCancelling] = useState(false)
  const pollRef = useRef<number | null>(null)

  useEffect(() => {
    if (ride && POLLING_STATUSES.includes(ride.status)) {
      pollRef.current = window.setInterval(() => onChanged(), 4000)
      return () => {
        if (pollRef.current) window.clearInterval(pollRef.current)
      }
    }
    return undefined
  }, [ride?.status, onChanged])

  function openSheet(leg: RideLeg) {
    setSheetLeg(leg)
    setSheetOpen(true)
  }

  async function onCancel() {
    if (!ride) return
    setCancelling(true)
    try {
      await cancelRide(ride.patient_id, ride.visit_id, ride.leg)
      onChanged()
    } finally {
      setCancelling(false)
    }
  }

  const sectionLabel =
    activeLeg === 'return'
      ? ride && ride.status !== 'cancelled'
        ? 'Your ride home'
        : 'Ready to head home?'
      : 'Your ride'

  return (
    <>
      <div>
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
          {sectionLabel}
        </p>

        {(!ride || ride.status === 'cancelled') && (
          <UnbookedCard
            onBook={() => openSheet(activeLeg)}
            context={context}
            leg={activeLeg}
          />
        )}

        {ride && ride.status !== 'cancelled' && ride.status !== 'completed' && (
          <ActiveRideCard ride={ride} onCancel={onCancel} cancelling={cancelling} />
        )}

        {ride && ride.status === 'completed' && <CompletedRideCard ride={ride} />}

        {outboundForReturnContext && outboundForReturnContext.status === 'completed' && (
          <p className="text-[11px] text-stone-400 mt-2 text-center">
            Outbound trip complete · {outboundForReturnContext.driver?.name ?? 'driver'} dropped you off
          </p>
        )}
      </div>

      <BookingSheet
        open={sheetOpen}
        leg={sheetLeg}
        context={context}
        timeOffset={timeOffset}
        onClose={() => setSheetOpen(false)}
        onBooked={() => {
          setSheetOpen(false)
          onChanged()
        }}
      />
    </>
  )
}

function UnbookedCard({
  onBook,
  context,
  leg,
}: {
  onBook: () => void
  context: PatientVisitContext
  leg: RideLeg
}) {
  const tx = context.transportation
  const isReturn = leg === 'return'
  const pickupIso = isReturn ? tx.suggested_return_pickup_iso : tx.suggested_outbound_pickup_iso
  const title = isReturn ? 'Book your ride home' : 'Book your ride'
  const subtitle = isReturn
    ? `Pickup from clinic, ${formatDayAndTime(pickupIso)}`
    : `Suggested pickup ${formatDayAndTime(pickupIso)}`
  const cta = isReturn ? `Tap to book ride home` : `Tap to book with ${tx.provider}`
  const policy = isReturn
    ? 'One tap and a driver heads to the clinic to bring you home — same sponsor-paid coverage.'
    : tx.policy_summary

  return (
    <Card className="overflow-hidden">
      <button onClick={onBook} className="w-full text-left">
        <div className="bg-gradient-to-br from-primary-50 via-white to-stone-50 border-b border-stone-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-primary-600 shrink-0">
              <Car className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-stone-900">{title}</p>
                {tx.sponsor_paid && (
                  <Badge variant="info" className="text-[10px]">
                    <Sparkles className="h-2.5 w-2.5" /> Sponsor-paid
                  </Badge>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-0.5">{subtitle}</p>
            </div>
          </div>
        </div>
        <CardBody className="py-3.5">
          <p className="text-xs text-stone-600 leading-relaxed mb-3">{policy}</p>
          <div className="flex items-center justify-between text-sm font-medium text-primary-700">
            <span>{cta}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardBody>
      </button>
    </Card>
  )
}

function ActiveRideCard({
  ride,
  onCancel,
  cancelling,
}: {
  ride: Ride
  onCancel: () => void
  cancelling: boolean
}) {
  const isLive = POLLING_STATUSES.includes(ride.status)
  const stage = isLive ? 'live' : 'confirmed'

  return (
    <Card className="overflow-hidden">
      <div
        className={cn(
          'px-5 py-3.5 border-b flex items-center justify-between',
          stage === 'live'
            ? 'bg-green-50 border-green-100'
            : 'bg-primary-50/60 border-primary-100',
        )}
      >
        <div className="flex items-center gap-2">
          {stage === 'live' ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
            </span>
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-primary-700" />
          )}
          <p
            className={cn(
              'text-xs font-semibold',
              stage === 'live' ? 'text-green-800' : 'text-primary-800',
            )}
          >
            {statusLabel(ride)}
          </p>
        </div>
        {ride.estimated_eta_minutes !== null && ride.status !== 'completed' && (
          <p
            className={cn(
              'text-xs font-medium tabular-nums',
              stage === 'live' ? 'text-green-800' : 'text-primary-800',
            )}
          >
            {ride.status === 'arrived_at_pickup'
              ? 'Driver waiting'
              : ride.status === 'in_transit'
                ? `~${ride.estimated_eta_minutes} min to arrive`
                : `ETA ${ride.estimated_eta_minutes} min`}
          </p>
        )}
      </div>

      <CardBody className="py-4 space-y-3">
        {ride.driver ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center font-semibold text-stone-700">
              {ride.driver.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-900">{ride.driver.name}</p>
              <p className="text-xs text-stone-600 flex items-center gap-1.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {ride.driver.rating.toFixed(2)}
                <span className="text-stone-300">·</span>
                <span>{ride.driver.vehicle}</span>
              </p>
              <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                {ride.driver.license_plate}
              </p>
            </div>
            <a
              href="tel:+15550140000"
              aria-label="Call driver"
              className="h-9 w-9 rounded-full border border-stone-200 hover:bg-stone-50 flex items-center justify-center text-stone-700"
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : (
          <p className="text-sm text-stone-700">
            Pickup scheduled for{' '}
            <span className="font-medium text-stone-900">
              {formatDayAndTime(ride.scheduled_pickup_iso)}
            </span>
            . Your driver will be assigned about 30 minutes before pickup.
          </p>
        )}

        <div className="space-y-1.5 pt-1">
          <div className="flex items-start gap-2 text-xs text-stone-700">
            <MapPin className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{ride.pickup_address}</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-stone-700">
            <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{ride.dropoff_address}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-stone-500">Confirmation</span>
            <span className="font-mono text-stone-800">{ride.confirmation_code}</span>
          </div>
          {ride.sponsor_paid && (
            <span className="flex items-center gap-1 text-primary-700 font-medium">
              <ShieldCheck className="h-3 w-3" /> Covered by your study
            </span>
          )}
        </div>

        {ride.with_caregiver && ride.caregiver_name && (
          <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-stone-50 rounded-lg px-2.5 py-1.5">
            <span className="font-medium text-stone-800">+1 rider:</span>
            <span>{ride.caregiver_name}</span>
          </div>
        )}

        {!isLive && (
          <button
            onClick={onCancel}
            disabled={cancelling}
            className="w-full h-9 rounded-lg border border-stone-200 text-xs text-stone-600 hover:text-stone-900 hover:border-stone-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <X className="h-3 w-3" />
            {cancelling ? 'Cancelling…' : 'Cancel ride'}
          </button>
        )}
      </CardBody>
    </Card>
  )
}

function CompletedRideCard({ ride }: { ride: Ride }) {
  return (
    <Card className="bg-stone-50/60">
      <CardBody className="py-3.5">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800">Trip complete</p>
            <p className="text-[11px] text-stone-500">
              {ride.driver ? `Dropped off by ${ride.driver.name}` : 'Trip ended'}
              {ride.sponsor_paid && ' · Covered by study'}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
