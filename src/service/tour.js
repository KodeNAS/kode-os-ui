/*
 * KODE OS — Easy-mode tour using driver.js. Triggered automatically on
 * first dashboard visit (gated by localStorage["kode_tour_seen"]) and
 * available on demand via the ? button in TopBar.
 *
 * Each step's `element` is a CSS selector that should be present in the
 * BeginnerDashboard DOM — selectors should target data-tour attributes
 * added to those elements so they're stable across refactors.
 */
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_SEEN_KEY = 'kode_tour_seen'

const baseConfig = {
  showProgress: true,
  smoothScroll: true,
  allowClose: true,
  overlayOpacity: 0.6,
  stagePadding: 8,
  stageRadius: 16,
  nextBtnText: 'Next',
  prevBtnText: 'Back',
  doneBtnText: 'Done',
  popoverClass: 'kode-tour-popover',
}

// Each entry maps to a data-tour="<key>" attribute somewhere in the
// DOM (BeginnerDashboard widgets, TopBar shell, mode pill, hint button).
// The full list is filtered at drive time so steps whose target isn't
// in the current layout get silently skipped — that way the tour
// adapts to whatever widgets the user actually has placed instead of
// pointing at empty space or failing to anchor.
function easySteps() {
  return [
    {
      popover: {
        title: 'Welcome to pebble',
        description: 'A quick tour of your dashboard — under a minute. Replay it anytime with the ? button at the top.',
        side: 'over',
        align: 'center',
      },
    },
    {
      element: '[data-tour="clock"]',
      popover: {
        title: 'Clock',
        description: 'Local time + date. Click the tile to swap between digital and analog. Edit mode shows a gear for 12/24h, seconds, etc.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="weather"]',
      popover: {
        title: 'Weather',
        description: 'Live conditions for your location with an optional forecast. The gear in edit mode lets you change city, units, or how many days ahead.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="apps"]',
      popover: {
        title: 'Your apps',
        description: 'Everything installed on your pebble — click any tile to open the app.',
        side: 'left',
      },
    },
    {
      element: '[data-tour="search"]',
      popover: {
        title: 'Web search',
        description: 'Search the web from here. Press Enter to open results in a new tab.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="photooftheday"]',
      popover: {
        title: 'Photo of the day',
        description: 'A nostalgic photo from your Immich library. Rotates daily — set it up from the Immich walkthrough or the widget gear.',
        side: 'left',
      },
    },
    {
      element: '[data-tour="recent"]',
      popover: {
        title: 'Recent activity',
        description: 'Your latest files. Click the chevron to expand the full list, or tap any row to jump into the file browser.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="files"]',
      popover: {
        title: 'Files',
        description: 'Opens the built-in file browser. Drop in everything you want backed up on your pebble.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="family"]',
      popover: {
        title: 'On your pebble',
        description: 'Accounts that use this pebble — handy for sharing.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="adddevice"]',
      popover: {
        title: 'Add a device',
        description: 'Step-by-step wizard for connecting a phone, computer, or smart TV.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="sysinfo"]',
      popover: {
        title: 'System monitor',
        description: 'Live CPU, memory, and disk usage. The gear in edit mode toggles temperature, sparkline, and refresh rate.',
        side: 'left',
      },
    },
    {
      element: '[data-tour="network"]',
      popover: {
        title: 'Network',
        description: 'Online status, your pebble\'s hostname, and a rolling 60-second graph of upload + download.',
        side: 'left',
      },
    },
    {
      element: '[data-tour="storage"]',
      popover: {
        title: 'Storage',
        description: 'Disk usage and SMART health. Anything red here means it\'s worth checking the drive in Settings.',
        side: 'left',
      },
    },
    {
      element: '[data-tour="tips"]',
      popover: {
        title: 'Tips & tricks',
        description: 'Cycles through small hints for getting more out of your pebble.',
        side: 'right',
      },
    },
    {
      // The top bar auto-hides on the desktop — when this step fires
      // we dispatch a custom event so Home.vue pins it visible until
      // the user moves on. onDeselected returns it to normal behavior.
      element: '[data-tour="topbar"]',
      popover: {
        title: 'Settings & shutdown',
        description: 'Hover the top of the screen to reveal this bar — account settings, system controls, language, and shutdown all live here.',
        side: 'bottom',
      },
      onHighlightStarted: () => {
        try { window.dispatchEvent(new CustomEvent('kode:reveal-topbar')) } catch (e) { /* ignore */ }
      },
      onDeselected: () => {
        try { window.dispatchEvent(new CustomEvent('kode:release-topbar')) } catch (e) { /* ignore */ }
      },
    },
    {
      element: '[data-tour="modepill"]',
      popover: {
        title: 'Easy / Advanced mode',
        description: 'Easy mode keeps things simple. Advanced exposes everything CasaOS does — switch anytime.',
        side: 'left',
      },
    },
    {
      element: '[data-tour="hintbutton"]',
      popover: {
        title: 'Hints anytime',
        description: 'Click this ? button to replay this tour or toggle hover hints on tiles.',
        side: 'bottom',
      },
    },
    {
      popover: {
        title: "You're set",
        description: 'Explore at your own pace. Your pebble is yours.',
        side: 'over',
        align: 'center',
      },
    },
  ]
}

// Drop steps whose target selector isn't anchored in the DOM. Without
// this filter, the tour would point at the page corner or float
// unattached for any widget the user hasn't placed — which made the
// tour feel broken on layouts that don't include every widget.
function filterStepsForDom(steps) {
  return steps.filter(step => {
    if (!step.element) return true
    try { return document.querySelector(step.element) != null }
    catch (e) { return false }
  })
}

/** Show the tour now. Marks tour-seen on completion or close. */
export function startEasyTour() {
  const tour = driver({
    ...baseConfig,
    steps: filterStepsForDom(easySteps()),
    onDestroyed: () => {
      // Belt-and-suspenders: if the user closes the tour while the
      // top-bar step is active, make sure we release the lock.
      try { window.dispatchEvent(new CustomEvent('kode:release-topbar')) } catch (e) { /* ignore */ }
      try { localStorage.setItem(TOUR_SEEN_KEY, '1') } catch (e) { /* ignore */ }
    },
  })
  tour.drive()
}

/** Trigger the tour automatically on first visit only. */
export function maybeStartEasyTourOnce() {
  try {
    if (localStorage.getItem(TOUR_SEEN_KEY) === '1') return
  } catch (e) { /* fall through and still attempt */ }
  // Defer one frame so the dashboard DOM has settled and data-tour
  // targets are attached.
  requestAnimationFrame(() => {
    setTimeout(() => startEasyTour(), 250)
  })
}

/** Reset the tour-seen flag — used by Factory reset. */
export function resetTourSeen() {
  try { localStorage.removeItem(TOUR_SEEN_KEY) } catch (e) { /* ignore */ }
}

export const HINT_MODE_KEY = 'kode_hint_mode'

export function isHintModeOn() {
  try { return localStorage.getItem(HINT_MODE_KEY) === '1' } catch (e) { return false }
}

export function setHintMode(on) {
  try {
    if (on) localStorage.setItem(HINT_MODE_KEY, '1')
    else localStorage.removeItem(HINT_MODE_KEY)
    // Tell anyone listening that hint mode changed.
    window.dispatchEvent(new CustomEvent('kode:hint-mode', { detail: { on: !!on } }))
  } catch (e) { /* ignore */ }
}
