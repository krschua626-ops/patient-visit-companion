import type { Ride, RideLeg, RideStatus } from './types.js'

const rides = new Map<string, Ride>()

function rideKey(patientId: string, visitId: string, leg: RideLeg): string {
  return `${patientId}::${visitId}::${leg}`
}

export function getRide(patientId: string, visitId: string, leg: RideLeg): Ride | null {
  return rides.get(rideKey(patientId, visitId, leg)) ?? null
}

export function getRidesForVisit(
  patientId: string,
  visitId: string,
): { outbound: Ride | null; return: Ride | null } {
  return {
    outbound: getRide(patientId, visitId, 'outbound'),
    return: getRide(patientId, visitId, 'return'),
  }
}

export function saveRide(ride: Ride): Ride {
  rides.set(rideKey(ride.patient_id, ride.visit_id, ride.leg), ride)
  return ride
}

export function updateRideStatus(
  patientId: string,
  visitId: string,
  leg: RideLeg,
  status: RideStatus,
  patch: Partial<Ride> = {},
): Ride | null {
  const existing = getRide(patientId, visitId, leg)
  if (!existing) return null
  const updated: Ride = {
    ...existing,
    ...patch,
    status,
    status_updated_iso: new Date().toISOString(),
  }
  rides.set(rideKey(patientId, visitId, leg), updated)
  return updated
}

export function cancelRide(patientId: string, visitId: string, leg: RideLeg): Ride | null {
  return updateRideStatus(patientId, visitId, leg, 'cancelled')
}

export function resetRides(): void {
  rides.clear()
}
