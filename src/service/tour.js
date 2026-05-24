/*
 * KODE OS — Easy-mode tour service.
 *
 * Builds the layout-aware step list and dispatches it to the
 * KodeTour.vue overlay (mounted globally in App.vue) via a window
 * CustomEvent. Replaces the prior driver.js implementation, whose
 * 1.4 positioning consistently rendered popovers in the top-left
 * corner on KODE layouts no matter what side/align we set.
 *
 * Layout-aware: reads `kode_chosen_template_v1` (written by
 * BeginnerDashboard.applyTemplate + Welcome.resetDashboardLayoutForFirstBoot)
 * and uses a per-template intro. Once any widget is moved / added /
 * removed, BeginnerDashboard.saveLayout clears that key and the tour
 * falls back to a generic "custom layout" intro.
 *
 * Each step shape (matches KodeTour.vue):
 *   - { selector, title, description, side?, onEnter?, onLeave? }
 *       → highlights the matching element with a spotlight + anchored card
 *   - { title, description }
 *       → centered modal card (no element, used for intro/outro)
 */

const TOUR_SEEN_KEY = 'kode_tour_seen'
const TEMPLATE_KEY = 'kode_chosen_template_v1'
const SHOW_EVENT = 'kode:tour-show'

// Per-widget popover content. Each entry maps a `data-tour` value to
// the title + description shown when the tour stops on that widget.
// Add an entry here when a new widget gets a [data-tour] attribute.
const WIDGET_POPOVERS = {
  clock: {
    title: 'Clock',
    description: 'Local time + date. Click the tile to swap between digital and analog. In Edit layout, hover the tile and click the gear to switch 12/24-hour, show seconds, or change date format.',
    side: 'bottom',
  },
  weather: {
    title: 'Weather',
    description: 'Live conditions for your location with an optional forecast. In Edit layout, hover and click the gear to change city, units (°C/°F), or how many days ahead to show.',
    side: 'bottom',
  },
  apps: {
    title: 'Your apps',
    description: 'Every app installed on your pebble. Click a tile to open it; the App Store (top of the dashboard) installs more.',
    side: 'left',
  },
  search: {
    title: 'Web search',
    description: 'Search the web from here. Press Enter to open results in a new tab — defaults to DuckDuckGo; change the engine via the gear in Edit layout.',
    side: 'bottom',
  },
  photooftheday: {
    title: 'Photo of the day',
    description: 'A nostalgic photo from your Immich library, rotated daily. Set it up once from the Immich walkthrough (or the widget\'s gear in Edit layout) — then it just runs.',
    side: 'left',
  },
  recent: {
    title: 'Recent activity',
    description: 'Your latest files. Click the chevron to expand the full list, or tap any row to jump straight into the file browser at that folder.',
    side: 'right',
  },
  files: {
    title: 'Files',
    description: 'Opens the built-in file browser at /DATA. Drag files in from your desktop to upload; right-click any item to share, rename, or download.',
    side: 'right',
  },
  family: {
    title: 'On your pebble',
    description: 'Everyone who uses this pebble. Click the + at the top right to add a family member (name, role, optional personal password). Hover a member to remove them. Multi-account logins on the pebble itself are on the roadmap.',
    side: 'right',
  },
  adddevice: {
    title: 'Add a device',
    description: 'Click for a step-by-step wizard that walks you through connecting a phone (Immich app + photo backup), a computer (Samba/SMB drive mount), or a smart TV (Jellyfin app).',
    side: 'right',
  },
  sysinfo: {
    title: 'System monitor',
    description: 'Live CPU, memory, and disk usage. In Edit layout, the gear toggles whether to show temperature, the sparkline graph, and the refresh rate.',
    side: 'left',
  },
  network: {
    title: 'Network',
    description: 'Online status, your pebble\'s hostname, and a rolling 60-second graph of upload + download speed across whichever interface you\'re on.',
    side: 'left',
  },
  storage: {
    title: 'Storage',
    description: 'Disk usage and SMART health for every drive. Anything red here means it\'s worth checking the drive in Settings → Storage.',
    side: 'left',
  },
  appsrunning: {
    title: 'Apps running',
    description: 'Live count of Docker containers that are up plus anything that recently restarted. Helps you spot a crashed app at a glance.',
    side: 'left',
  },
  tips: {
    title: 'Tips & tricks',
    description: 'Cycles through small hints for getting more out of your pebble — keyboard shortcuts, app pairings, settings worth turning on.',
    side: 'right',
  },
}

// Per-template intro line. Each one names the layout, says what
// shape it is, and sets expectations. Generated copy falls back to
// GENERIC_INTRO if no template matches (custom layout).
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

// Build the per-layout step list.
//   1. Open with a Welcome card sized to whichever template the user
//      is on (TEMPLATE_INTROS) or a generic line if customised.
//   2. Walk each data-tour widget IN DOM ORDER (top→bottom, left→
//      right), pulling its popover from WIDGET_POPOVERS.
//   3. Close with the topbar settings cog + hint button so the user
//      knows where help lives, then a final "you're set" card.
function buildSteps() {
  const steps = []

  let templateKey = ''
  try { templateKey = localStorage.getItem(TEMPLATE_KEY) || '' } catch (e) { /* ignore */ }
  const intro = TEMPLATE_INTROS[templateKey] || GENERIC_INTRO

  // Discover every widget anchored in the live dashboard. NodeList in
  // document order — exactly the visual top→bottom order the user sees.
  // app:* shortcuts have an empty data-tour (no entry in tourKeyFor)
  // and get filtered out here so the tour doesn't try to stop on them.
  //
  // SCOPED to `.beginner-dashboard` because there can be a second
  // hidden BeginnerDashboard mounted (Vue keep-alive, advanced-mode
  // preload, etc.) whose widget-slots return zero-size rects from
  // getBoundingClientRect — those would silently break the spotlight.
  const anchored = []
  try {
    const nodes = document.querySelectorAll('.beginner-dashboard [data-tour]')
    nodes.forEach(node => {
      const key = node.getAttribute('data-tour')
      if (!key || anchored.find(a => a.key === key)) return
      if (!WIDGET_POPOVERS[key]) return
      anchored.push({ key, selector: `.beginner-dashboard [data-tour="${key}"]` })
    })
  } catch (e) { /* ignore */ }

  const count = anchored.length
  const widgetSummary = count === 0
    ? ''
    : ` We\'ll stop at ${count} widget${count === 1 ? '' : 's'}.`

  steps.push({
    title: intro.title,
    description: `${intro.description}${widgetSummary}`,
  })

  // Edit-layout step BEFORE the widget walk so the user knows from
  // the start that everything is rearrangeable.
  if (document.querySelector('.beginner-dashboard [data-tour="editlayout"]')) {
    steps.push({
      selector: '.beginner-dashboard [data-tour="editlayout"]',
      title: 'Edit layout',
      description: 'Click here to enter Edit mode. Then: drag any widget between columns, drag the dividers to resize, hover a widget to see the × (remove) and gear (settings) buttons, and tap "+ Add widget" at the bottom for more. Click Done when you\'re happy.',
      side: 'bottom',
    })
  }

  for (const { key, selector } of anchored) {
    const pop = WIDGET_POPOVERS[key]
    steps.push({
      selector,
      title: pop.title,
      description: pop.description,
      side: pop.side,
    })
  }

  // Settings cog in the topbar. The topbar auto-hides via
  // `transform: translateY(-100%)` with a 0.35s transition — we
  // reveal it on enter and re-trigger a reposition once the slide-
  // down finishes so the spotlight lands on the actual cog button
  // (rather than the topbar bar) at its post-animation position.
  if (document.querySelector('[data-tour="settings"]')) {
    steps.push({
      selector: '[data-tour="settings"]',
      title: 'Settings & shutdown',
      description: 'The gear is your settings menu — account, language, network, factory reset, and shutdown all live here. The bar auto-hides; hover the very top of the screen to bring it back anytime.',
      side: 'bottom',
      onEnter: () => {
        try { window.dispatchEvent(new CustomEvent('kode:reveal-topbar')) } catch (e) { /* ignore */ }
        setTimeout(() => {
          try { window.dispatchEvent(new CustomEvent('kode:tour-reposition')) } catch (e) { /* ignore */ }
        }, 400)
      },
      onLeave: () => {
        try { window.dispatchEvent(new CustomEvent('kode:release-topbar')) } catch (e) { /* ignore */ }
      },
    })
  }

  if (document.querySelector('[data-tour="hintbutton"]')) {
    steps.push({
      selector: '[data-tour="hintbutton"]',
      title: 'Hints anytime',
      description: 'Click this ? button to replay this tour or toggle hover hints on tiles.',
      side: 'bottom',
    })
  }

  // Closing card — flavored to whether the user is on a known premade
  // (mention they can swap templates) or a custom layout.
  steps.push({
    title: templateKey ? 'You\'re set' : 'Looking good',
    description: templateKey
      ? 'Swap to a different layout anytime from Edit layout → Pre-made.'
      : 'Hit Edit layout to keep customising. Replay this tour from the ? button when you change things up.',
  })

  return steps
}

/** Show the tour now. Marks tour-seen when the overlay closes. */
export function startEasyTour() {
  const steps = buildSteps()
  if (steps.length === 0) return
  // Listener wires up once on first call so resetTourSeen → replay
  // doesn't accumulate dupes. Marks tour-seen on every close.
  if (!startEasyTour._listenerArmed) {
    window.addEventListener('kode:tour-done', () => {
      try { localStorage.setItem(TOUR_SEEN_KEY, '1') } catch (e) { /* ignore */ }
      // Belt-and-suspenders: release the topbar in case the user closed
      // mid-tour during the topbar step.
      try { window.dispatchEvent(new CustomEvent('kode:release-topbar')) } catch (e) { /* ignore */ }
    })
    startEasyTour._listenerArmed = true
  }
  window.dispatchEvent(new CustomEvent(SHOW_EVENT, { detail: { steps } }))
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
    window.dispatchEvent(new CustomEvent('kode:hint-mode', { detail: { on: !!on } }))
  } catch (e) { /* ignore */ }
}
