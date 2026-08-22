/**
 * Pure ISO Date-only string utilities (YYYY-MM-DD)
 * Prevents any local or UTC timezone boundary shifts.
 */

/**
 * Add or subtract integer days to a YYYY-MM-DD string.
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Number of calendar days between two YYYY-MM-DD dates.
 * e.g., diffDays('2026-08-22', '2026-08-25') => 3
 */
export function diffDays(startDateStr: string, endDateStr: string): number {
  const [y1, m1, d1] = startDateStr.split('-').map(Number);
  const [y2, m2, d2] = endDateStr.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Get the next stop's arrival date based on existing stops.
 * If 0 stops: trip.startDate
 * If >=1 stops: previousStop.endDate
 */
export function getNextStopArrival(tripStartDate: string, existingStops: { endDate: string }[]): string {
  if (!existingStops || existingStops.length === 0) {
    return tripStartDate;
  }
  const lastStop = existingStops[existingStops.length - 1];
  return lastStop.endDate;
}

/**
 * Validate sequential dates for a new stop before inserting.
 */
export function validateNewStopDates(
  tripStartDate: string,
  tripEndDate: string,
  existingStops: { endDate: string }[],
  arrivalDate: string,
  departureDate: string
): { valid: boolean; error?: string } {
  const expectedArrival = getNextStopArrival(tripStartDate, existingStops);

  if (arrivalDate !== expectedArrival) {
    if (existingStops.length === 0) {
      return {
        valid: false,
        error: `First stop arrival date must be the trip start date (${tripStartDate}).`,
      };
    }
    return {
      valid: false,
      error: `Arrival date must start when the previous stop ends (${expectedArrival}).`,
    };
  }

  if (arrivalDate < tripStartDate) {
    return {
      valid: false,
      error: `Arrival date cannot be before the trip start date (${tripStartDate}).`,
    };
  }

  if (arrivalDate > tripEndDate) {
    return {
      valid: false,
      error: `Arrival date cannot be after the trip end date (${tripEndDate}).`,
    };
  }

  if (departureDate < arrivalDate) {
    return {
      valid: false,
      error: `Departure date cannot be before arrival date (${arrivalDate}).`,
    };
  }

  if (departureDate > tripEndDate) {
    return {
      valid: false,
      error: `Departure date cannot be after the trip end date (${tripEndDate}).`,
    };
  }

  return { valid: true };
}
