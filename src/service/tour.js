/*
 * KODE OS — Easy-mode tour using driver.js. Triggered automatically on
 * first dashboard visit (gated by localStorage["kode_tour_seen"]) and
 * available on demand via the ? button in TopBar.
 *
 * Layout-aware: the tour reads `kode_chosen_template_v1` (set by
 * BeginnerDashboard.applyTemplate + Welcome.resetDashboardLayoutForFirstBoot)
 * and uses a per-template intro line so a user on Minimalist sees
 * a different welcome than one on Full 2. Once any widget is moved /
 * added / removed, BeginnerDashboard.saveLayout clears that key and
 * the tour falls back to a generic "custom layout" intro.
 *
 * Steps walked: every [data-tour] widget present in the live DOM, in
 * document order. WIDGET_POPOVERS holds the per-widget popover copy;
 * add an entry there when a new widget gets a data-tour anchor.
 */
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_SEEN_KEY = 'kode_tour_seen'
const TEMPLATE_KEY = 'kode_chosen_template_v1'

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

// Per-template intro line. Each one names the layout, says what
// shape it is (cols × what's where), and sets expectations for how
// many stops the tour has. Generated copy reads "Welcome to your
// pebble" if no template is matched (custom layout).
const TEMPLATE_INTROS = {
  'builtin-default': {
    title: 'Welcome to your pebble — Default layout',
    description: 'Three columns: clock + weather on the left, your apps in the middle, family and quick-links on the right. Tap Next to walk through each widget.',
  },
  'builtin-essential-1': {
    title: 'Welcome to your pebble — Essential layout',
    description: 'Three columns built for the essentials: clock + recent files left, search + apps + system info middle, weather + utilities right.',
  },
  'builtin-minimalist-1': {
    title: 'Welcome to your pebble — Minimalist layout',
    description: 'Two columns, the absolute essentials. Search and the clock on one side, apps and files on the other.',
  },
  'builtin-simple-1': {
    title: 'Welcome to your pebble — Simple layout',
    description: 'Two-column shortcut layout: search + apps on the left, clock + weather on the right.',
  },
  'builtin-full-1': {
    title: 'Welcome to your pebble — Full layout',
    description: 'Three columns: clock + weather left, search/family/utilities middle, plus quick-launch shortcuts to each app on the right.',
  },
  'builtin-full-2': {
    title: 'Welcome to your pebble — Full 2 layout',
    description: 'Four columns, every widget on the dashboard. About a minute to walk through them all.',
  },
}

const GENERIC_INTRO = {
  title: 'Welcome to your pebble',
  description: 'A quick tour of your dashboard. Replay it anytime with the ? button at the top.',
}

// Build the per-layout step list. We:
//   1. Open with a Welcome card sized to whichever template the user
//      is on (TEMPLATE_INTROS) or a generic line if they've already
//      customised the layout.
//   2. Walk each data-tour widget IN DOM ORDER (top→bottom, left→
//      right), pulling its popover from WIDGET_POPOVERS so the user
//      sees them in the same order they're laid out.
//   3. Close with the topbar + hint button so the user knows where
//      help lives, then a final "you're set" card.
function buildStepsForLayout() {
  const steps = []

  // Layout intro: prefer the per-template flavor if the user is
  // currently on a known premade. Cleared as soon as they customise.
  let templateKey = ''
  try { templateKey = localStorage.getItem(TEMPLATE_KEY) || '' } catch (e) { /* ignore */ }
  const intro = TEMPLATE_INTROS[templateKey] || GENERIC_INTRO

  // Discover every widget anchored in the live dashboard. NodeList in
  // document order — exactly the visual top→bottom order the user sees.
  // app:* shortcuts have an empty data-tour (no entry in tourKeyFor)
  // and get filtered out here so the tour doesn't try to stop on them.
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
  const widgetSummary = count === 0
    ? ''
    : ` We\'ll stop at ${count} widget${count === 1 ? '' : 's'}.`

  steps.push({
    popover: {
      title: intro.title,
      description: `${intro.description}${widgetSummary}`,
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

  // Closing card — flavored to whether the user is on a known premade
  // (mention they can swap templates from Edit layout) or a custom
  // layout (mention they're already personalising).
  const closingTitle = templateKey ? 'You\'re set' : 'Looking good'
  const closingDesc = templateKey
    ? 'Swap to a different layout anytime from Edit layout → Pre-made.'
    : 'Hit Edit layout to keep customising. Replay this tour from the ? button when you change things up.'
  steps.push({
    popover: {
      title: closingTitle,
      description: closingDesc,
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
