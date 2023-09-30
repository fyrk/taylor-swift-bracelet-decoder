// use client from PR [0]
// until plausible-tracker supports navigator.sendBeacon [1]
// and doesn't break target="_blank" [2]
// [0] https://github.com/plausible/plausible-tracker/pull/54
// [1] https://github.com/plausible/plausible-tracker/issues/12
// [2] https://github.com/plausible/plausible-tracker/issues/12
import Plausible, {
  EventOptions,
  PlausibleOptions,
} from "./plausible-tracker-sendbeacon/src"

export enum PlausibleEvent {
  EnterQuery = "Enter Query",
  Share = "Share",
}

// not exported in plausible-tracker
type TrackEvent = (
  eventName: string,
  options?: EventOptions,
  eventData?: PlausibleOptions,
) => void
let _trackPlausibleEvent: TrackEvent | undefined

export default function setupPlausible() {
  if (import.meta.env.VITE_PLAUSIBLE_DOMAIN) {
    const plausible = Plausible({
      domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN,
      apiHost:
        import.meta.env.VITE_PLAUSIBLE_API_HOST || "https://plausible.io",
      trackLocalhost: true,
      useSendBeacon: true,
    })
    plausible.enableAutoPageviews()
    plausible.enableAutoOutboundTracking()
    _trackPlausibleEvent = plausible.trackEvent
  }
}

export const trackPlausibleEvent = (
  eventName: PlausibleEvent,
  eventData?: EventOptions,
  options?: PlausibleOptions,
) => {
  try {
    if (!_trackPlausibleEvent) setupPlausible()
    _trackPlausibleEvent && _trackPlausibleEvent(eventName, eventData, options)
  } catch (e) {
    console.error(e)
  }
}
