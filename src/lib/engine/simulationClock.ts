import { ParsedState } from '../parser';
import { formatDateLocation, parseDateLocation } from './timeEngine';

/**
 * Player actions resolve at the current calendar date. The real-time clock is
 * the only source that advances the calendar; this helper updates the activity
 * counter and prevents generated responses from changing the date or age.
 */
export function applyActionClock(
  currentState: ParsedState,
  candidateState: ParsedState,
  activityNumber: number
): ParsedState {
  const currentClock = parseDateLocation(currentState.dateLocation);
  const nextState: ParsedState = {
    ...candidateState,
    dateLocation: formatDateLocation(currentClock.date, currentClock.location, activityNumber)
  };

  const currentAge = currentState.personalInfo?.['나이'];
  if (currentAge !== undefined) {
    nextState.personalInfo = {
      ...(candidateState.personalInfo || {}),
      '나이': currentAge
    };
  }

  return nextState;
}
