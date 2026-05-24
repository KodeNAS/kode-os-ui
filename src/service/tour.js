/*
 * KODE OS — Easy-mode tour using driver.js. Triggered automatically on
 * first dashboard visit (gated by localStorage["kode_tour_seen"]) and
 * available on demand via the ? button in TopBar.
 *
 * Per-layout: the tour reads each widget's data-tour attribute live
 * from the DOM, then builds the step list from what's actually placed.
 * That way a user on Minimalist sees a 3-stop tour, a user on Full 2
 * sees the full canvas, and adding/removing a widget on the fly is
 * reflected on the next replay.
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

// Per-widget popover content. Each entry maps a `data-tour` value to
// the title + description shown when the tour stops on that widget.
// Add an entry here when a new widget gets a [data-tour] attribute.
const WIDGET_POPOVERS = {
  clock: {
    title: 'Clock',
    description: 'Local time + date. Click the tile to swap between digital and analog. Edit mode shows a gear for 12/24h, seconds, etc.',
    side: 'bottom',
  },
  weather: {
    title: 'Weather',
    description: 'Live conditions for your location with an optional forecast. The gear in edit mode lets you change city, units, or how many days ahead.',
    side: 'bottom',
  },
  apps: {
    title: 'Your apps',
    description: 'Everything installed on your pebble — click any tile to open the app.',
    side: 'left',
  },
  search: {
    title: 'Web search',
    description: 'Search the web from here. Press Enter to open results in a new tab.',
    side: 'bottom',
  },
  photooftheday: {
    title: 'Photo of the day',
    description: 'A nostalgic photo from your Immich library. Rotates daily — set it up from the Immich walkthrough or the widget gear.',
    side: 'left',
  },
  recent: {
    title: 'Recent activity',
    description: 'Your latest files. Click the chevron to expand the full list, or tap any row to jump into the file browser.',
    side: 'right',
  },
  files: {
    title: 'Files',
    description: 'Opens the built-in file browser. Drop in everything you want backed up on your pebble.',
    side: 'right',
  },
  family: {
    title: 'On your pebble',
    description: 'Accounts that use this pebble — handy for sharing.',
    side: 'right',
  },
  adddevice: {
    title: 'Add a device',
    description: 'Step-by-step wizard for connecting a phone, computer, or smart TV.',
    side: 'right',
  },
  sysinfo: {
    title: 'System monitor',
    description: 'Live CPU, memory, and disk usage. The gear in edit mode toggles temperature, sparkline, and refresh rate.',
    side: 'left',
  },
  network: {
    title: 'Network',
    description: 'Online status, your pebble\'s hostname, and a rolling 60-second graph of upload + download.',
    side: 'left',
  },
  storage: {
    title: 'Storage',
    description: 'Disk usage and SMART health. Anything red here means it\'s worth checking the drive in Settings.',
    side: 'left',
  },
  appsrunning: {
    title: 'Apps running',
    description: 'Live count of Docker containers up + recently restarted.',
    side: 'left',
  },
  tips: {
    title: 'Tips & tricks',
    description: 'Cycles through small hints for getting more out of your pebble.',
    side: 'right',
  },
}

// Build the per-layout step list. We:
//   1. Open with a Welcome card that names how many widgets we'll
//      walk through, so the tour feels personalised to the layout.
//   2. Walk each data-tour widget IN DOM ORDER (top→bottom, left→
//      right), pulling its popover from WIDGET_POPOVERS so the user
//      sees them in the same order they're laid out.
//   3. Close with the topbar + hint button so the user knows where
//      help lives, then a final "you're set" card.
function buildStepsForLayout() {
  const steps = []
  // Discover every widget anchored in the live dashboard. NodeList in
  // document order — exactly the visual top→bottom order the user sees.
  const anchored = []
  try {
    const nodes = document.querySelectorAll('.beginner-dashboard [data-tour]')
    nodes.forEach(node => {
      const key = node.getAttribute('data-tour')
      if (!key || anchored.find(a => a.key === key)) return
      if (!WIDGET_POPOVERS[key]) return
      anchored.push({ key, selector: `[data-tour="${key}"]` })
    })
  } catch (e) { /* ignore — fall through to empty */ }

  const count = anchored.length
  const layoutLabel = count === 0
    ? 'Your dashboard is set up.'
    : `We\'ll walk through the ${count} widget${count === 1 ? '' : 's'} on your dashboard — under a minute.`

  steps.push({
    popover: {
      title: 'Welcome to pebble',
      description: `${layoutLabel} Replay it anytime with the ? button at the top.`,
      side: 'over',
      align: 'center',
    },
  })

  for (const { key, selector } of anchored) {
    steps.push({
      element: selector,
      popover: WIDGET_POPOVERS[key],
    })
  }

  // Top bar auto-hides — we reveal it for this step then release after.
  if (document.querySelector('[data-tour="topbar"]')) {
    steps.push({
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
    })
  }

  if (document.querySelector('[data-tour="hintbutton"]')) {
    steps.push({
      element: '[data-tour="hintbutton"]',
      popover: {
        title: 'Hints anytime',
        description: 'Click this ? button to replay this tour or toggle hover hints on tiles.',
        side: 'bottom',
      },
    })
  }

  steps.push({
    popover: {
      title: "You're set",
      description: 'Explore at your own pace. Your pebble is yours.',
      side: 'over',
      align: 'center',
    },
  })

  return steps
}

/** Show the tour now. Marks tour-seen on completion or close. */
export function startEasyTour() {
  const tour = driver({
    ...baseConfig,
    steps: buildStepsForLayout(),
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
