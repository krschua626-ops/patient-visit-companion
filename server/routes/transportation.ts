import { Router } from 'express'
import { assembleContext, getPatient, getStudy } from '../contextAssembler.js'
import { getRide, saveRide, updateRideStatus, cancelRide as cancelRideStore } from '../rideStore.js'
import type { Ride, RideLeg, RideStatus, TimeOffset } from '../types.js'

const FAKE_DRIVERS = [
  { name: 'Marcus T.', vehicle: 'Black Toyota Camry', license_plate: '8KLR297', rating: 4.93 },
  { name: 'Priya R.', vehicle: 'Silver Honda CR-V', license_plate: '5MTH841', rating: 4.97 },
  { name: 'Diego A.', vehicle: 'Blue Hyundai Sonata', license_plate: '7QPB663', rating: 4.89 },
  { name: 'Aisha N.', vehicle: 'White Toyota Sienna', license_plate: '3VFN029', rating: 4.95 },
  { name: 'Liam K.', vehicle: 'Black Tesla Model Y', license_plate: '9XRS418', rating: 4.91 },
]

const VEHICLE_FARES: Record<Ride['vehicle_preference'], number> = {
  uberx: 28.4,
  uber_comfort: 36.7,
  uber_xl: 48.2,
  wav: 28.4,
}

export const transportationRouter = Router()

interface BookBody {
  patientId: string
  visitId: string
  timeOffset: TimeOffset
  leg: RideLeg
  scheduled_pickup_iso?: string
  vehicle_preference?: Ride['vehicle_preference']
  with_caregiver?: boolean
  wheelchair_accessible?: boolean
  notes_for_driver?: string
}

transportationRouter.post('/transportation/book', (req, res) => {
  const body = req.body as BookBody
  if (!body.patientId || !body.visitId || !body.leg || !body.timeOffset) {
    return res.status(400).json({ error: 'patientId, visitId, leg, and timeOffset are required' })
  }
  const ctx = assembleContext(body.patientId, body.visitId, body.timeOffset)
  const patient = getPatient(body.patientId)
  if (!ctx || !patient) return res.status(404).json({ error: 'Patient or visit not found' })

  const tx = ctx.transportation
  const homeAddress = tx.home_address
  const siteAddress = tx.site_address
  const isOutbound = body.leg === 'outbound'

  const scheduledIso =
    body.scheduled_pickup_iso ||
    (isOutbound ? tx.suggested_outbound_pickup_iso : tx.suggested_return_pickup_iso)

  const vehiclePref = body.vehicle_preference ?? tx.default_vehicle_preference
  const withCaregiver = body.with_caregiver ?? (isOutbound ? tx.caregiver_default : false)
  const wheelchair = body.wheelchair_accessible ?? tx.wheelchair_accessible_required

  const driver = FAKE_DRIVERS[Math.floor(Math.random() * FAKE_DRIVERS.length)]
  const baseFare = VEHICLE_FARES[vehiclePref] ?? 28.4
  const adjusted = wheelchair ? baseFare + 4 : baseFare

  const initialStatus: RideStatus =
    (body.timeOffset === 'morning_of' && isOutbound) ||
    (body.timeOffset === 'post_visit' && !isOutbound)
      ? 'driver_assigned'
      : 'confirmed'

  const ride: Ride = {
    id: `ride_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    patient_id: body.patientId,
    visit_id: body.visitId,
    leg: body.leg,
    status: initialStatus,
    pickup_address: isOutbound ? homeAddress : siteAddress,
    dropoff_address: isOutbound ? siteAddress : homeAddress,
    scheduled_pickup_iso: scheduledIso,
    vehicle_preference: vehiclePref,
    wheelchair_accessible: wheelchair,
    with_caregiver: withCaregiver,
    caregiver_name: withCaregiver ? patient.caregiver?.name ?? null : null,
    notes_for_driver: body.notes_for_driver ?? patient.transportation.notes_for_driver,
    driver: initialStatus === 'driver_assigned' ? driver : null,
    estimated_eta_minutes: initialStatus === 'driver_assigned' ? 8 : null,
    estimated_cost_usd: Math.round(adjusted * 100) / 100,
    sponsor_paid: getStudy().transportation.sponsor_paid,
    confirmation_code: makeConfirmationCode(),
    booked_at_iso: new Date().toISOString(),
    status_updated_iso: new Date().toISOString(),
  }

  saveRide(ride)
  res.json(progressRideStatus(ride, body.timeOffset))
})

transportationRouter.get('/transportation/:patientId/:visitId/:leg', (req, res) => {
  const { patientId, visitId, leg } = req.params
  const timeOffset = (req.query.timeOffset as TimeOffset | undefined) ?? 'morning_of'
  if (leg !== 'outbound' && leg !== 'return') {
    return res.status(400).json({ error: 'leg must be outbound or return' })
  }
  const ride = getRide(patientId, visitId, leg as RideLeg)
  if (!ride) return res.status(404).json({ error: 'No ride found' })
  res.json(progressRideStatus(ride, timeOffset))
})

transportationRouter.post('/transportation/:patientId/:visitId/:leg/cancel', (req, res) => {
  const { patientId, visitId, leg } = req.params
  if (leg !== 'outbound' && leg !== 'return') {
    return res.status(400).json({ error: 'leg must be outbound or return' })
  }
  const cancelled = cancelRideStore(patientId, visitId, leg as RideLeg)
  if (!cancelled) return res.status(404).json({ error: 'No ride found' })
  res.json(cancelled)
})

function makeConfirmationCode(): string {
  return 'UH-' + Math.random().toString(36).toUpperCase().slice(2, 8)
}

function progressRideStatus(ride: Ride, timeOffset: TimeOffset): Ride {
  if (ride.status === 'completed' || ride.status === 'cancelled') return ride
  const eligible =
    (timeOffset === 'morning_of' && ride.leg === 'outbound') ||
    (timeOffset === 'post_visit' && ride.leg === 'return')
  if (!eligible) return ride

  const elapsedSec = Math.floor((Date.now() - new Date(ride.booked_at_iso).getTime()) / 1000)
  const driver = ride.driver ?? FAKE_DRIVERS[0]

  let next: { status: RideStatus; eta: number | null } = { status: ride.status, eta: ride.estimated_eta_minutes }
  if (elapsedSec < 8) next = { status: 'driver_assigned', eta: 8 }
  else if (elapsedSec < 25) next = { status: 'en_route_to_pickup', eta: Math.max(1, 8 - Math.floor(elapsedSec / 3)) }
  else if (elapsedSec < 45) next = { status: 'arrived_at_pickup', eta: 0 }
  else if (elapsedSec < 90) next = { status: 'in_transit', eta: 12 - Math.floor((elapsedSec - 45) / 5) }
  else next = { status: 'completed', eta: 0 }

  if (next.status !== ride.status || next.eta !== ride.estimated_eta_minutes) {
    return (
      updateRideStatus(ride.patient_id, ride.visit_id, ride.leg, next.status, {
        driver,
        estimated_eta_minutes: next.eta,
      }) ?? ride
    )
  }
  return ride
}
