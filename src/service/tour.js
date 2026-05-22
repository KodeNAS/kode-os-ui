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

function easySteps() {
  return [
    {
      popover: {
        title: 'Welcome to pebble',
        description: 'Quick tour — 30 seconds. You can replay this anytime from the ? button in the top bar.',
        side: 'over',
        align: 'center',
      },
    },
    {
      element: '[data-tour="apps"]',
      popover: {
        title: 'Your apps',
        description: 'These are the apps you picked during setup. Click any to open.',
        side: 'left',
      },
    },
    {
      element: '[data-tour="files"]',
      popover: {
        title: 'Files',
        description: 'Built-in file browser for everything on your pebble. Click to open.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="recent"]',
      popover: {
        title: 'Recent activity',
        description: 'Your latest files and uploads — tap any to jump into the file browser.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="family"]',
      popover: {
        title: 'On your pebble',
        description: 'Accounts that use this pebble. The "+" lets you add more (coming soon).',
        side: 'right',
      },
    },
    {
      element: '[data-tour="adddevice"]',
      popover: {
        title: 'Add a device',
        description: 'Connect a phone, computer, or smart TV to your pebble. Opens a step-by-step wizard.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="modepill"]',
      popover: {
        title: 'Easy / Advanced mode',
        description: 'Easy mode hides advanced tools. Switch to Advanced anytime — you can always come back here.',
        side: 'left',
      },
    },
    {
      element: '[data-tour="hintbutton"]',
      popover: {
        title: 'Hints anytime',
        description: 'Click this ? button to replay the tour, or toggle hover hints on tiles.',
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

/** Show the tour now. Marks tour-seen on completion or close. */
export function startEasyTour() {
  const tour = driver({
    ...baseConfig,
    steps: easySteps(),
    onDestroyed: () => {
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
